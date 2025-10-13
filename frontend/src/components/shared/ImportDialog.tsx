import { useState } from "react";
import { useIntl } from "react-intl";
import { Upload, FileDown, AlertCircle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  businessInfoId?: string;
  onSuccess: () => void;
}

interface ImportResults {
  summary: {
    [key: string]: {
      total: number;
      success: number;
      updated: number;
      failed: number;
    };
  };
  results: {
    [key: string]: {
      success: any[];
      updated: any[];
      failed: any[];
    };
  };
}

export default function ImportDialog({
  open,
  onClose,
  businessInfoId,
  onSuccess,
}: ImportDialogProps) {
  const intl = useIntl();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(
        "/business-info/template/download",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "business_info_template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(
        intl.formatMessage({ id: "business_info.template_download_success" })
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.template_download_failed" })
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (
      !validTypes.includes(selectedFile.type) &&
      fileExtension !== "xlsx" &&
      fileExtension !== "xls"
    ) {
      toast.error(intl.formatMessage({ id: "business_info.invalid_file_type" }));
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(intl.formatMessage({ id: "business_info.file_too_large" }));
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setImportResults(null);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(intl.formatMessage({ id: "business_info.no_file_selected" }));
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    const loadingToast = toast.loading(
      intl.formatMessage({ id: "business_info.importing" })
    );

    try {
      const endpoint = businessInfoId
        ? `/business-info/${businessInfoId}/import`
        : "/business-info/import";

      const response: any = await axiosInstance.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);

      if (response?.data) {
        const data = response.data;
        setImportResults(data);

        const summary = data.summary || {};
        const totalSuccess = Object.values(summary).reduce(
          (acc: number, curr: any) => acc + (curr.success || 0) + (curr.updated || 0),
          0
        );
        const totalFailed = Object.values(summary).reduce(
          (acc: number, curr: any) => acc + (curr.failed || 0),
          0
        );

        if (totalSuccess > 0 && totalFailed === 0) {
          toast.success(
            intl.formatMessage(
              { id: "business_info.import_success_all" },
              { count: totalSuccess }
            )
          );
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        } else if (totalSuccess > 0 && totalFailed > 0) {
          toast.success(
            intl.formatMessage(
              { id: "business_info.import_success_partial" },
              { success: totalSuccess, failed: totalFailed }
            )
          );
        } else if (totalFailed > 0 && totalSuccess === 0) {
          toast.error(
            intl.formatMessage(
              { id: "business_info.import_failed_all" },
              { count: totalFailed }
            )
          );
        }
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.import_failed" })
      );
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setImportResults(null);
      onClose();
    }
  };

  const getSectionName = (key: string) => {
    const names: { [key: string]: string } = {
      aboutSections: intl.formatMessage({ id: "business_info.about_sections" }),
      members: intl.formatMessage({ id: "business_info.team_members" }),
      partners: intl.formatMessage({ id: "business_info.partners" }),
      locations: intl.formatMessage({ id: "business_info.locations" }),
      reviews: intl.formatMessage({ id: "business_info.reviews" }),
    };
    return names[key] || key;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        aria-describedby="import-business-info-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {intl.formatMessage({ id: "business_info.import_title" })}
          </DialogTitle>
          <DialogDescription id="import-business-info-description">
            {intl.formatMessage({ id: "business_info.import_description" })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          {!importResults && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Button
                onClick={handleDownloadTemplate}
                className="cursor-pointer text-white mb-3 w-full"
                variant="default"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {intl.formatMessage({
                  id: "business_info.download_template",
                })}
              </Button>
              <h4 className="font-semibold text-blue-900 mb-2">
                {intl.formatMessage({
                  id: "business_info.import_instructions_title",
                })}
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  {intl.formatMessage({
                    id: "business_info.import_instruction_1",
                  })}
                </li>
                <li>
                  {intl.formatMessage({
                    id: "business_info.import_instruction_2",
                  })}
                </li>
                <li>
                  {intl.formatMessage({
                    id: "business_info.import_instruction_3",
                  })}
                </li>
                <li>
                  {intl.formatMessage({
                    id: "business_info.import_instruction_4",
                  })}
                </li>
              </ol>
            </div>
          )}

          {/* File Upload */}
          {!importResults && (
            <div className="space-y-2">
              <Label>
                {intl.formatMessage({ id: "business_info.select_file" })}
              </Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={importing}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-gray-600">
                  {intl.formatMessage({ id: "business_info.selected_file" })}:{" "}
                  <span className="font-medium">{file.name}</span> (
                  {(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {intl.formatMessage({ id: "business_info.import_results" })}
              </h3>

              {Object.entries(importResults.summary || {}).map(([key, value]) => {
                const hasData = value.total > 0;
                if (!hasData) return null;

                const successRate =
                  value.total > 0
                    ? ((value.success + value.updated) / value.total) * 100
                    : 0;

                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{getSectionName(key)}</h4>
                      <span
                        className={`text-sm font-medium ${
                          successRate === 100
                            ? "text-green-600"
                            : successRate > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {successRate.toFixed(0)}%{" "}
                        {intl.formatMessage({
                          id: "business_info.success_rate",
                        })}
                      </span>
                    </div>

                    <Progress value={successRate} className="mb-3" />

                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-gray-600">
                          {intl.formatMessage({ id: "business_info.total" })}
                        </div>
                        <div className="font-medium text-lg">{value.total}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <div className="text-green-600">
                          {intl.formatMessage({ id: "business_info.new" })}
                        </div>
                        <div className="font-medium text-lg text-green-700">
                          {value.success}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <div className="text-blue-600">
                          {intl.formatMessage({ id: "business_info.updated" })}
                        </div>
                        <div className="font-medium text-lg text-blue-700">
                          {value.updated}
                        </div>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-center">
                        <div className="text-red-600">
                          {intl.formatMessage({ id: "business_info.failed" })}
                        </div>
                        <div className="font-medium text-lg text-red-700">
                          {value.failed}
                        </div>
                      </div>
                    </div>

                    {/* Show failed items */}
                    {importResults.results?.[key]?.failed?.length > 0 && (
                      <Alert className="mt-3" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="text-sm">
                            <p className="font-medium mb-1">
                              {intl.formatMessage({
                                id: "business_info.failed_items",
                              })}
                              :
                            </p>
                            {importResults.results[key].failed
                              .slice(0, 3)
                              .map((item: any, idx: number) => (
                                <div key={idx} className="text-xs mt-1">
                                  • {item.error || JSON.stringify(item.data).substring(0, 100)}
                                </div>
                              ))}
                            {importResults.results[key].failed.length > 3 && (
                              <div className="text-xs mt-1 text-gray-500">
                                {intl.formatMessage(
                                  { id: "business_info.and_more" },
                                  {
                                    count:
                                      importResults.results[key].failed.length - 3,
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Show success message */}
                    {value.success + value.updated > 0 && value.failed === 0 && (
                      <Alert className="mt-3" variant="default">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600">
                          {intl.formatMessage({
                            id: "business_info.all_items_success",
                          })}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={importing}>
              {importResults
                ? intl.formatMessage({ id: "common.close" })
                : intl.formatMessage({ id: "common.cancel" })}
            </Button>
          </DialogClose>
          {!importResults && (
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="text-white"
            >
              {importing ? (
                <>{intl.formatMessage({ id: "business_info.importing" })}</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "business_info.import_button" })}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}