import { useState } from "react";
import { useIntl } from 'react-intl';
import GeneralTab from "./GeneralTab";
import EventsLogsTab from "./EventsLogsTab";
import useAuth from "@/hooks/useAuth";
import { User } from "lucide-react";

export default function SystemSettings() {
  const intl = useIntl();
  const [active, setActive] = useState("general");
  const { admin } = useAuth();

  const tabs = [
    { key: "general", label: intl.formatMessage({ id: "system_settings.general" }) },
    { key: "events", label: intl.formatMessage({ id: "system_settings.events_logs" }) },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen page-container" dir={intl.locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Cover Image */}
        <div className="relative mb-6">
          {/* Cover Image Background */}
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg overflow-hidden">
            {admin?.coverImage ? (
              <img
                src={admin.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40" />
            )}
          </div>
          
          {/* Header Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                {/* Admin Avatar */}
                <div className="w-16 h-16 bg-white rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
                  {admin?.avatar || admin?.profilePicture ? (
                    <img
                      src={admin?.avatar || admin?.profilePicture}
                      alt="Admin"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                {/* Title and Description */}
                <div className="text-white">
                  <h1 className="text-2xl font-semibold">
                    {intl.formatMessage({ id: "system_settings.title" })}
                  </h1>
                  <p className="text-sm opacity-90">
                    {intl.formatMessage({ id: "system_settings.welcome_message" }, { name: admin?.firstName || intl.formatMessage({ id: "system_settings.admin" }) })}
                  </p>
                </div>
              </div>

              {/* Admin Info */}
              <div className="text-left text-white">
                <div className="text-sm opacity-90">{intl.formatMessage({ id: "system_settings.logged_in_as" })}</div>
                <div className="font-medium">{admin?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="bg-white rounded-md shadow-sm mb-6">
          <ul className="flex border-b">
            {tabs.map((t) => (
              <li
                key={t.key}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  active === t.key
                    ? "border-b-2 border-primary font-semibold text-primary"
                    : "text-gray-600 hover:text-gray-800"
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
          {active === "general" && <GeneralTab />}
          {active === "events" && <EventsLogsTab />}
        </main>
      </div>
    </div>
  );
}