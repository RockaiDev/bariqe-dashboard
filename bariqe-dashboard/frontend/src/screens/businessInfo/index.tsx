import { useState } from "react";
import { useIntl } from "react-intl";
import { Building2, Download,FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";
import LoadingComponent from "@/components/shared/LoadingComponent";


// Tabs
import BasicInfoTab from "./tabs/BasicInfoTab";
// import AboutSectionsTab from "./tabs/AboutSectionsTab";
import MembersTab from "./tabs/MembersTab";
import PartnersTab from "./tabs/PartnersTab";
import LocationsTab from "./tabs/LocationsTab";
import ReviewsTab from "./tabs/ReviewsTab";
// import MediaTab from "./tabs/MediaTab";
import ImportDialog from "@/components/shared/ImportDialog";

export default function BusinessInfo() {
  const intl = useIntl();
  const [active, setActive] = useState("basic");
  const [exportLoading, setExportLoading] = useState(false);
  // const [templateLoading, setTemplateLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false); // Add this state

  // ✅ React Query - Fix: Extract data from response
  const {
    data: businessInfoResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["business-info"],
    queryFn: async () => {
      const response = await axiosInstance.get("/business-info");
      return response; // ✅ Return data instead of full response
    },
    retry: false,
  });
  console.log(businessInfoResponse);
  const businessInfo: any = businessInfoResponse;

  const tabs = [
    {
      key: "basic",
      label: intl.formatMessage({ id: "business_info.basic_info" }),
    },
    // {
    //   key: "about",
    //   label: intl.formatMessage({ id: "business_info.about_sections" }),
    // },
    {
      key: "members",
      label: intl.formatMessage({ id: "business_info.team_members" }),
    },
    {
      key: "partners",
      label: intl.formatMessage({ id: "business_info.partners" }),
    },
    {
      key: "locations",
      label: intl.formatMessage({ id: "business_info.locations" }),
    },
    {
      key: "reviews",
      label: intl.formatMessage({ id: "business_info.reviews" }),
    },
    // {
    //   key: "media",
    //   label: intl.formatMessage({ id: "business_info.media" }),
    // },
  ];

  async function handleExport() {
    setExportLoading(true);
    const loadingToast = toast.loading(
      intl.formatMessage({ id: "business_info.exporting" })
    );

    try {
      const response = await axiosInstance.get("/business-info/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "business_info_export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(
        intl.formatMessage({ id: "business_info.export_success" })
      );
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(
        error?.response?.data?.message ||
          intl.formatMessage({ id: "business_info.export_failed" })
      );
    } finally {
      setExportLoading(false);
    }
  }

  // async function handleDownloadTemplate() {
  //   setTemplateLoading(true);
  //   const loadingToast = toast.loading(
  //     intl.formatMessage({ id: "business_info.downloading_template" })
  //   );

  //   try {
  //     const response = await axiosInstance.get(
  //       "/business-info/template/download",
  //       {
  //         responseType: "blob",
  //       }
  //     );

  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement("a");
  //     link.href = url;

  //     const contentDisposition = response.headers["content-disposition"];
  //     let filename = "business_info_template.xlsx";
  //     if (contentDisposition) {
  //       const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  //       if (filenameMatch) filename = filenameMatch[1];
  //     }

  //     link.setAttribute("download", filename);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     window.URL.revokeObjectURL(url);

  //     toast.dismiss(loadingToast);
  //     toast.success(
  //       intl.formatMessage({ id: "business_info.template_download_success" })
  //     );
  //   } catch (error: any) {
  //     toast.dismiss(loadingToast);
  //     toast.error(
  //       error?.response?.data?.message ||
  //         intl.formatMessage({ id: "business_info.template_download_failed" })
  //     );
  //   } finally {
  //     setTemplateLoading(false);
  //   }
  // }

  if (isLoading) return <LoadingComponent />;

  return (
    <div
      className="p-6 bg-gray-50 min-h-screen page-container"
      dir={intl.locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Cover */}
        <div className="relative mb-6">
          <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-white/50" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex items-center justify-center border-4 border-white shadow-lg p-2">
                  {businessInfo?.logo ? (
                    <img
                      src={businessInfo.logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                <div className="text-white">
                  <h1 className="text-3xl font-bold">
                    {intl.locale === "ar"
                      ? businessInfo?.title_ar ||
                        intl.formatMessage({ id: "business_info.title" })
                      : businessInfo?.title_en ||
                        intl.formatMessage({ id: "business_info.title" })}
                  </h1>
                  <p className="text-sm opacity-90 mt-1">
                    {intl.formatMessage({ id: "business_info.subtitle" })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Import Button - NEW */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  className="bg-white/90 hover:bg-white"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {intl.formatMessage({ id: "business_info.import" })}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exportLoading || !businessInfo}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading
                    ? intl.formatMessage({ id: "business_info.exporting" })
                    : intl.formatMessage({ id: "business_info.export" })}
                </Button>

                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={templateLoading}
                  className="bg-white/90 hover:bg-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {templateLoading
                    ? intl.formatMessage({ id: "business_info.downloading" })
                    : intl.formatMessage({ id: "business_info.template" })}
                </Button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
          <ul className="flex border-b whitespace-nowrap">
            {tabs.map((t) => (
              <li
                key={t.key}
                className={`px-6 py-4 cursor-pointer transition-all ${
                  active === t.key
                    ? "border-b-2 border-primary font-semibold text-primary bg-primary/5"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setActive(t.key)}
              >
                {t.label}
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main>
          {active === "basic" && (
            <BasicInfoTab businessInfo={businessInfo} onUpdate={refetch} />
          )}
          {/* {active === "about" && (
            <AboutSectionsTab businessInfo={businessInfo} onUpdate={refetch} />
          )} */}
          {active === "members" && (
            <MembersTab businessInfo={businessInfo} onUpdate={refetch} />
          )}
          {active === "partners" && (
            <PartnersTab businessInfo={businessInfo} onUpdate={refetch} />
          )}
          {active === "locations" && (
            <LocationsTab businessInfo={businessInfo} onUpdate={refetch} />
          )}
          {active === "reviews" && (
            <ReviewsTab businessInfo={businessInfo} onUpdate={refetch} />
          )}
          {/* {active === "media" && (
            <MediaTab businessInfo={businessInfo} onUpdate={refetch} />
          )} */}
        </main>

        {/* Import Dialog - NEW */}
        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          businessInfoId={businessInfo?._id}
          onSuccess={() => {
            refetch();
            setImportDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}