import { useState } from "react";
import { useIntl } from 'react-intl';
import GeneralTab from "./GeneralTab";
import EventsLogsTab from "./EventsLogsTab";
import useAuth from "@/hooks/useAuth";
import { User, Settings, Calendar, ChevronRight, Shield, Mail } from "lucide-react";

export default function SystemSettings() {
  const intl = useIntl();
  const [active, setActive] = useState("general");
  const { admin } = useAuth();

  const tabs = [
    { 
      key: "general", 
      label: intl.formatMessage({ id: "system_settings.general" }),
      icon: Settings,
      description: intl.formatMessage({ id: "system_settings.general_description" })
    },
    { 
      key: "events", 
      label: intl.formatMessage({ id: "system_settings.events_logs" }),
      icon: Calendar,
      description: intl.formatMessage({ id: "system_settings.events_logs_description" })
    },
  ];

  const activeTab = tabs.find(tab => tab.key === active);

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen" dir={intl.locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Cover Image - محسّن للموبايل */}
        <div className="relative mb-4 sm:mb-6">
          {/* Cover Image Background */}
          <div className="h-24 sm:h-32 lg:h-40 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg overflow-hidden">
            {admin?.coverImage ? (
              <img
                src={admin.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-purple-600 relative">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
              </div>
            )}
          </div>
          
          {/* Header Content - محسّن للموبايل */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-end gap-3 sm:gap-4">
                {/* Admin Avatar - محسّن */}
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-full overflow-hidden flex items-center justify-center border-3 sm:border-4 border-white shadow-xl">
                    {admin?.avatar || admin?.profilePicture ? (
                      <img
                        src={admin?.avatar || admin?.profilePicture}
                        alt="Admin"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" />
                    )}
                  </div>
                  {/* Status indicator */}
                  <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                {/* Title and Description - محسّن */}
                <div className="text-white">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
                    {intl.formatMessage({ id: "system_settings.title" })}
                  </h1>
                  <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                    {intl.formatMessage({ id: "system_settings.welcome_message" }, { 
                      name: admin?.firstName || intl.formatMessage({ id: "system_settings.admin" }) 
                    })}
                  </p>
                </div>
              </div>

              {/* Admin Info - محسّن للموبايل */}
              <div className={`${intl.locale === 'ar' ? 'text-right' : 'text-left'} sm:${intl.locale === 'ar' ? 'text-left' : 'text-right'} text-white`}>
                <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{intl.formatMessage({ id: "system_settings.logged_in_as" })}</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-xs sm:text-sm mt-1">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px] lg:max-w-none">
                    {admin?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - محسّن للموبايل */}
        <nav className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 overflow-hidden">
          {/* Desktop & Tablet View */}
          <ul className="hidden sm:flex border-b">
            {tabs.map((t) => (
              <li
                key={t.key}
                className={`flex-1 px-4 py-3 lg:py-4 cursor-pointer transition-all duration-200 relative group ${
                  active === t.key
                    ? "bg-primary/5 border-b-2 border-primary"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActive(t.key)}
              >
                <div className="flex items-center gap-3">
                  <t.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${
                    active === t.key ? "text-primary" : "text-gray-500 group-hover:text-gray-700"
                  }`} />
                  <div>
                    <div className={`font-medium text-sm lg:text-base ${
                      active === t.key ? "text-primary" : "text-gray-700"
                    }`}>
                      {t.label}
                    </div>
                    {/* <div className="text-xs text-gray-500 hidden lg:block">
                      {t.description}
                    </div> */}
                  </div>
                </div>
                {active === t.key && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"></div>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile View - قائمة محسّنة */}
          <div className="sm:hidden">
            <div className="p-3 border-b border-gray-100">
              {/* <div className="text-xs text-gray-500 mb-1">
                {intl.formatMessage({ id: "system_settings.current_section" })}
              </div> */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeTab && (
                    <>
                      <activeTab.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm text-gray-900">{activeTab.label}</span>
                    </>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                  intl.locale === 'ar' ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`w-full px-3 py-3 flex items-center justify-between transition-colors ${
                    active === t.key
                      ? "bg-primary/5"
                      : "hover:bg-gray-50 active:bg-gray-100"
                  }`}
                  onClick={() => setActive(t.key)}
                >
                  <div className="flex items-center gap-3">
                    <t.icon className={`w-4 h-4 ${
                      active === t.key ? "text-primary" : "text-gray-500"
                    }`} />
                    <div className="text-left">
                      <div className={`text-sm font-medium ${
                        active === t.key ? "text-primary" : "text-gray-700"
                      }`}>
                        {t.label}
                      </div>
                      {/* <div className="text-xs text-gray-500 mt-0.5">
                        {t.description}
                      </div> */}
                    </div>
                  </div>
                  {active === t.key && (
                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Active Tab Indicator - للموبايل */}
        <div className="sm:hidden bg-primary/10 text-primary px-3 py-2 rounded-lg mb-4 flex items-center gap-2 text-sm">
          {activeTab && (
            <>
              <activeTab.icon className="w-4 h-4" />
              <span className="font-medium">{activeTab.label}</span>
            </>
          )}
        </div>

        {/* Main Content - محسّن */}
        <main className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 min-h-[400px] animate-fadeIn">
          <div className="transition-all duration-300">
            {active === "general" && <GeneralTab />}
            {active === "events" && <EventsLogsTab />}
          </div>
        </main>

        {/* Footer Info - اختياري */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>
            {intl.formatMessage({ id: "system_settings.last_login" })}: {' '}
            {new Date().toLocaleDateString(intl.locale === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}