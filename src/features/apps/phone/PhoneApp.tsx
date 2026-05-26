"use client";

import {
  Clock3,
  Info,
  MessageCircle,
  Mic,
  Phone,
  PhoneCall,
  Play,
  Search,
  Star,
  UserRound,
  Video,
  Voicemail,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { phoneContent } from "@/content/apps/phone";

type PhoneTab = "recents" | "favorites" | "voicemail";

const sidebarItems: Array<{ id: PhoneTab; label: string; icon: LucideIcon }> = [
  { id: "recents", label: "Recents", icon: Clock3 },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "voicemail", label: "Voicemail", icon: Voicemail },
];

export function PhoneApp() {
  const [tab, setTab] = useState<PhoneTab>("recents");
  const [selectedCallId, setSelectedCallId] = useState(phoneContent.recents[0]?.id ?? "");
  const [selectedContactId, setSelectedContactId] = useState(phoneContent.contacts[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [audioId, setAudioId] = useState<string | null>(null);
  const { track } = useAnalytics();
  const notify = useWindowStore((state) => state.notify);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleRecents = phoneContent.recents.filter((call) => `${call.name} ${call.type} ${call.time}`.toLowerCase().includes(normalizedQuery));
  const visibleContacts = phoneContent.contacts.filter((contact) => contact.name.toLowerCase().includes(normalizedQuery));
  const visibleVoicemails = phoneContent.voicemails.filter((voice) => voice.title.toLowerCase().includes(normalizedQuery));
  const selectedCall = phoneContent.recents.find((call) => call.id === selectedCallId) ?? phoneContent.recents[0];
  const selectedContact = phoneContent.contacts.find((contact) => contact.id === selectedContactId) ?? phoneContent.contacts[0];
  const selectedPerson = tab === "favorites" ? selectedContact : selectedCall;
  const selectedName = tab === "voicemail" ? (phoneContent.voicemails[0]?.title ?? "Voicemail") : (selectedPerson?.name ?? "Contact");
  const selectedInitial = tab === "voicemail" ? "VM" : selectedPerson && "initials" in selectedPerson ? selectedPerson.initials : selectedName.slice(0, 1);

  const runCallAction = (action: string, name: string) => {
    notify({
      appId: "phone",
      title: action,
      body: `${name} is handled as a local simulated call action.`,
    });
    track({ eventType: "CALL_ACTION_CLICKED", appId: "phone", metadata: { action, name } });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[190px_minmax(430px,1fr)] bg-[#f6f6f6] text-slate-950">
      <aside className="flex min-h-0 flex-col border-r border-black/10 bg-[#e9e9eb]/88 px-3 pb-4 pt-3 backdrop-blur-xl">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-white/75 px-2 text-[13px] text-slate-500 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
          <Search className="size-4" />
          <input
            aria-label="Search calls"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-500"
            placeholder="Search"
          />
        </label>
        <nav className="mt-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium ${tab === item.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-700 hover:bg-white/55"}`}
              >
                <Icon className={`size-4 ${tab === item.id ? "text-[#007aff]" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-white/55 p-3 text-[12px] leading-relaxed text-slate-600 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
          <p className="font-semibold text-slate-700">iCloud Calls</p>
          <p className="mt-1">Available for FaceTime Audio and phone relays.</p>
        </div>
      </aside>

      <section className="grid min-h-0 grid-cols-[minmax(180px,240px)_minmax(250px,1fr)] overflow-auto">
        <div className="min-h-0 border-r border-black/10 bg-white/78">
          <header className="sticky top-0 z-10 border-b border-black/10 bg-white/85 px-5 py-4 backdrop-blur-xl">
            <h1 className="text-[26px] font-semibold tracking-normal">{sidebarItems.find((item) => item.id === tab)?.label}</h1>
          </header>

          <div className="max-h-full overflow-auto">
            {tab === "recents"
              ? visibleRecents.map((call) => (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => {
                      setSelectedCallId(call.id);
                      track({ eventType: "CALL_LOG_OPENED", appId: "phone", metadata: { callId: call.id } });
                    }}
                    className={`flex w-full items-center gap-3 border-b border-black/[0.06] px-4 py-3 text-left ${selectedCallId === call.id ? "bg-[#dcecff]" : "hover:bg-slate-50"}`}
                  >
                    <span className={`grid size-9 place-items-center rounded-full ${call.type === "Missed" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                      <PhoneCall className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[14px] font-semibold ${call.type === "Missed" ? "text-red-600" : "text-slate-950"}`}>{call.name}</span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {call.type} - {call.time}
                      </span>
                    </span>
                    <span className="text-[12px] text-slate-500">{call.duration}</span>
                  </button>
                ))
              : null}

            {tab === "favorites"
              ? visibleContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setSelectedContactId(contact.id);
                      track({ eventType: "FAVORITE_CONTACT_OPENED", appId: "phone", metadata: { contactId: contact.id } });
                    }}
                    className={`flex w-full items-center gap-3 border-b border-black/[0.06] px-4 py-3 text-left ${selectedContactId === contact.id ? "bg-[#dcecff]" : "hover:bg-slate-50"}`}
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-gradient-to-b from-slate-300 to-slate-400 text-sm font-semibold text-white shadow-inner">
                      {contact.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{contact.name}</span>
                      <span className="block text-[12px] text-slate-500">Favorite</span>
                    </span>
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                  </button>
                ))
              : null}

            {tab === "voicemail"
              ? visibleVoicemails.map((voice) => (
                  <div key={voice.id} className="border-b border-black/[0.06] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                        <Mic className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{voice.title}</p>
                        <p className="text-[12px] text-slate-500">{voice.duration}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAudioId(voice.id);
                          track({ eventType: "VOICEMAIL_PLAYED", appId: "phone", metadata: { voicemailId: voice.id } });
                        }}
                        className="grid size-8 place-items-center rounded-full bg-[#007aff] text-white shadow-sm hover:bg-[#0067d6]"
                        aria-label={`Play ${voice.title}`}
                      >
                        <Play className="ml-0.5 size-4 fill-current" />
                      </button>
                    </div>
                    {audioId === voice.id ? <audio className="mt-4 w-full" controls src={voice.src} autoPlay /> : null}
                  </div>
                ))
              : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col items-center overflow-auto bg-gradient-to-b from-[#fbfbfb] to-[#eeeeef] px-5 py-8 text-center">
          <div className="grid size-28 place-items-center rounded-full bg-gradient-to-b from-[#d8dde4] to-[#aab1bd] text-[40px] font-semibold text-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.5),0_12px_28px_rgba(0,0,0,0.12)]">
            {selectedInitial}
          </div>
          <h2 className="mt-4 text-[30px] font-semibold tracking-normal">{selectedName}</h2>
          <p className="mt-1 text-[13px] text-slate-500">
            {tab === "recents" && selectedCall ? `${selectedCall.type} call - ${selectedCall.time} - ${selectedCall.duration}` : null}
            {tab === "favorites" && selectedContact ? "Favorite contact" : null}
            {tab === "voicemail" ? "Saved voicemail" : null}
          </p>

          <div className="mt-7 grid w-full max-w-[330px] grid-cols-4 gap-2">
            <button type="button" onClick={() => runCallAction("Audio call", selectedName)} className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white/92 text-[12px] font-medium text-slate-700 shadow-sm ring-1 ring-black/10 hover:bg-white">
              <Phone className="size-5 text-emerald-600" />
              Audio
            </button>
            <button type="button" onClick={() => runCallAction("Video call", selectedName)} className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white/92 text-[12px] font-medium text-slate-700 shadow-sm ring-1 ring-black/10 hover:bg-white">
              <Video className="size-5 text-[#007aff]" />
              Video
            </button>
            <button type="button" onClick={() => runCallAction("Message", selectedName)} className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white/92 text-[12px] font-medium text-slate-700 shadow-sm ring-1 ring-black/10 hover:bg-white">
              <MessageCircle className="size-5 text-[#007aff]" />
              Message
            </button>
            <button type="button" onClick={() => runCallAction("Details", selectedName)} className="flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white/92 text-[12px] font-medium text-slate-700 shadow-sm ring-1 ring-black/10 hover:bg-white">
              <Info className="size-5 text-slate-600" />
              Info
            </button>
          </div>

          <div className="mt-8 w-full max-w-[420px] rounded-2xl border border-black/10 bg-white/78 p-4 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#f2f2f7] text-slate-500">
                <UserRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">Call summary</p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {tab === "voicemail" ? "Saved audio message with local playback." : "Available actions for the selected caller."}
                </p>
              </div>
            </div>
            {tab === "recents" && selectedCall ? (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]">
                <div className="rounded-xl bg-slate-50 px-2 py-3">
                  <p className="text-slate-500">Type</p>
                  <p className="mt-1 font-semibold">{selectedCall.type}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-3">
                  <p className="text-slate-500">When</p>
                  <p className="mt-1 font-semibold">{selectedCall.time}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-3">
                  <p className="text-slate-500">Length</p>
                  <p className="mt-1 font-semibold">{selectedCall.duration}</p>
                </div>
              </div>
            ) : null}
            {tab === "voicemail" ? (
              <button type="button" onClick={() => runCallAction("Saved voicemail", "Audio Note")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#007aff] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0067d6]">
                <Voicemail className="size-4" />
                Save to Gallery
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
