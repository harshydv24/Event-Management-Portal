import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  FileText,
  Upload,
  Loader2,
  Eye,
  Trash2,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent, clubs } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);

  // Validation state for each section
  const [sectionValidation, setSectionValidation] = useState({
    details: null as 'valid' | 'invalid' | null,
    documents: null as 'valid' | 'invalid' | null,
    review: null as 'valid' | 'invalid' | null
  });

  const [uploading, setUploading] = useState({
    proposal: false,
    m2m: false
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    expectedParticipants: "",
    guestName: "",
    proposalPdf: null as File | null,
    proposalUrl: "",
    m2mPdf: null as File | null,
    m2mUrl: ""
  });

  const club = clubs.find((c) => c.id === user?.clubId);

  // Validation functions
  const validateDetails = () => {
    const { name, description, date, expectedParticipants } = formData;
    return name.trim() !== '' &&
      description.trim() !== '' &&
      date !== '' &&
      expectedParticipants !== '' &&
      !isNaN(Number(expectedParticipants)) &&
      Number(expectedParticipants) > 0;
  };

  const validateDocuments = () => {
    // Documents are optional for now, but we can add validation later if needed
    return true;
  };

  // Function to validate and navigate to next step
  const validateAndNavigate = (fromSection: string, toSection: string) => {
    let isValid = false;

    if (fromSection === 'details') {
      isValid = validateDetails();
    } else if (fromSection === 'documents') {
      isValid = validateDocuments();
    }

    // Update validation state for the current section
    setSectionValidation(prev => ({
      ...prev,
      [fromSection]: isValid ? 'valid' : 'invalid'
    }));

    // Navigate to next section
    setStep(toSection);
  };

  // Comprehensive validation for final submission
  const validateAllSections = () => {
    const missingFields: { [key: string]: string[] } = {};

    // Validate Details section
    const detailsMissing: string[] = [];
    if (!formData.name.trim()) detailsMissing.push("Event Name");
    if (!formData.description.trim()) detailsMissing.push("Description");
    if (!formData.date) detailsMissing.push("Date");
    if (!formData.expectedParticipants || isNaN(Number(formData.expectedParticipants)) || Number(formData.expectedParticipants) <= 0) {
      detailsMissing.push("Expected Participants");
    }
    if (detailsMissing.length > 0) {
      missingFields["Details"] = detailsMissing;
    }

    // Validate Documents section (optional for now, but can be made mandatory)
    // const documentsMissing: string[] = [];
    // if (!formData.proposalUrl) documentsMissing.push("Proposal PDF");
    // if (!formData.m2mUrl) documentsMissing.push("M2M PDF");
    // if (documentsMissing.length > 0) {
    //   missingFields["Documents"] = documentsMissing;
    // }

    return {
      isValid: Object.keys(missingFields).length === 0,
      missingFields
    };
  };

  // Handle pre-submission validation
  const handlePreSubmitValidation = () => {
    const validation = validateAllSections();

    if (!validation.isValid) {
      // Create detailed error message
      const errorMessages: string[] = [];
      Object.entries(validation.missingFields).forEach(([section, fields]) => {
        errorMessages.push(`${section}: ${fields.join(", ")}`);
      });

      toast({
        title: "Missing Mandatory Details",
        description: errorMessages.join(" • "),
        variant: "destructive",
        duration: 6000, // Show for 6 seconds
      });
      return;
    }

    // If validation passes, show confirmation dialog
    setConfirmOpen(true);
  };
  const mockUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file)); // fake URL
      }, 1200);
    });
  };

  const handleMockFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "proposal" | "m2m"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [type]: true }));

    const url = await mockUpload(file);

    if (type === "proposal") {
      setFormData((prev) => ({
        ...prev,
        proposalPdf: file,
        proposalUrl: url
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        m2mPdf: file,
        m2mUrl: url
      }));
    }

    setUploading((prev) => ({ ...prev, [type]: false }));
  };

  const removeFile = (type: "proposal" | "m2m") => {
    setFormData((prev) => ({
      ...prev,
      [type === "proposal" ? "proposalPdf" : "m2mPdf"]: null,
      [type === "proposal" ? "proposalUrl" : "m2mUrl"]: ""
    }));
  };

  const handleFinalSubmit = async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);

    createEvent({
      name: formData.name,
      description: formData.description,
      date: formData.date,
      expectedParticipants:
        parseInt(formData.expectedParticipants) || 0,
      guestName: formData.guestName,
      proposalPdf: formData.proposalUrl,
      m2mPdf: formData.m2mUrl,
      clubId: user?.clubId || "",
      clubName: club?.name || "Unknown Club",
      status: "pending_approval"
    });

    // Fake success animation delay
    setTimeout(() => {
      toast({
        title: "Event Submitted!",
        description: "Your event is now pending approval."
      });
      navigate("/club/events");
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in pb-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Create New Event
            </CardTitle>
            <CardDescription>
              Follow the steps to submit your event for approval
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={step} onValueChange={setStep}>
              <TabsList className="grid grid-cols-3 w-full gap-1.5 select-none pointer-events-none">
                <TabsTrigger
                  value="details"
                  className={step === "details" ? "bg-indigo-600 text-white" : ""}
                >
                  <div className="flex items-center gap-1">
                    Details
                    {sectionValidation.details === 'invalid' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className={step === "documents" ? "bg-indigo-600 text-white" : ""}
                >
                  <div className="flex items-center gap-1">
                    Documents
                    {sectionValidation.documents === 'invalid' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="review"
                  className={step === "review" ? "bg-indigo-600 text-white" : ""}
                >
                  <div className="flex items-center gap-1">
                    Review
                    {sectionValidation.review === 'invalid' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </TabsTrigger>
              </TabsList>


              {/* STEP 1: EVENT DETAILS */}
              <TabsContent value="details">
                <div className="space-y-4 mt-6">
                  <div>
                    <Label>Event Name *</Label>
                    <Input
                      placeholder="Enter event name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      rows={4}
                      placeholder="Describe your event..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Expected Participants *</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 100"
                        value={formData.expectedParticipants}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expectedParticipants: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Guest Name (Optional)</Label>
                    <Input
                      placeholder="Chief Guest / Guest Speaker"
                      value={formData.guestName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestName: e.target.value
                        })
                      }
                    />
                  </div>

                  <Button
                    className="mt-4 w-full"
                    onClick={() => validateAndNavigate("details", "documents")}
                  >
                    Upload Documents
                  </Button>
                </div>
              </TabsContent>

              {/* STEP 2: DOCUMENTS */}
              <TabsContent value="documents">
                <div className="space-y-6 mt-6">
                  {/* Proposal Upload */}
                  <div className="space-y-2">
                    <Label>Proposal PDF</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 opacity-60" />

                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload proposal PDF
                      </p>

                      <Input
                        type="file"
                        accept=".pdf"
                        className="mt-2 cursor-pointer"
                        onChange={(e) => handleMockFileUpload(e, "proposal")}
                      />

                      {uploading.proposal && (
                        <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* M2M Upload */}
                  <div className="space-y-2">
                    <Label>M2M PDF</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 opacity-60" />

                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload M2M PDF
                      </p>

                      <Input
                        type="file"
                        accept=".pdf"
                        className="mt-2 cursor-pointer"
                        onChange={(e) => handleMockFileUpload(e, "m2m")}
                      />

                      {uploading.m2m && (
                        <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("details")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Details
                    </Button>

                    <Button
                      className="flex-1"
                      onClick={() => validateAndNavigate("documents", "review")}
                    >
                      Review Details
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* STEP 3: REVIEW */}
              <TabsContent value="review">
                <div className="mt-6 space-y-6">
                  {/* DETAILS SUMMARY */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Event Overview</h3>
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Date:</strong> {formData.date}</p>
                    <p>
                      <strong>Participants:</strong>{" "}
                      {formData.expectedParticipants}
                    </p>
                    <p><strong>Guest:</strong> {formData.guestName || "None"}</p>
                  </div>

                  {/* TABLE FOR DOCUMENTS */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Documents</h3>

                    <table className="w-full text-left border">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2">Type</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Proposal</td>
                          <td className="p-2">
                            {formData.proposalPdf
                              ? formData.proposalPdf.name
                              : "Not uploaded"}
                          </td>
                          <td className="p-2 flex gap-2">
                            {formData.proposalUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPreviewPdf(formData.proposalUrl)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {formData.proposalUrl && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFile("proposal")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>

                        <tr>
                          <td className="p-2">M2M</td>
                          <td className="p-2">
                            {formData.m2mPdf
                              ? formData.m2mPdf.name
                              : "Not uploaded"}
                          </td>
                          <td className="p-2 flex gap-2">
                            {formData.m2mUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPreviewPdf(formData.m2mUrl)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {formData.m2mUrl && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFile("m2m")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("documents")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Documents
                    </Button>

                    <Button
                      className="flex-1"
                      onClick={handlePreSubmitValidation}
                      disabled={isSubmitting}
                    >
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* PDF PREVIEW MODAL */}
      <Dialog open={!!previewPdf} onOpenChange={() => setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl h-[85vh]">
          <iframe
            src={previewPdf || ""}
            className="w-full h-full rounded"
            title="PDF Preview"
          />
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>

          <p>
            Once submitted, the event will be sent for approval and cannot be
            edited.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreateEvent;
