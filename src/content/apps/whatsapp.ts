export const whatsappContent = {
  chats: [
    {
      id: "product-thread",
      name: "Product Thread",
      avatar: "P",
      lastMessage: "Wireframe",
      time: "10:42",
      pinned: true,
      messages: [
        { id: "m1", from: "them", type: "text", body: "Did the lock screen copy get updated?", time: "9:40", status: "read" },
        { id: "m2", from: "me", type: "text", body: "Almost. I am swapping in generated media next.", time: "9:42", status: "read" },
        { id: "m3", from: "me", type: "media", body: "Wireframe", time: "10:05", status: "read" },
        { id: "m4", from: "me", type: "voice", body: "0:18", time: "10:18", status: "read" },
        { id: "m5", from: "me", type: "text", body: "This one is intentionally stuck so the retry state stays visible.", time: "10:43", status: "failed" },
      ],
    },
    {
      id: "research-notes",
      name: "Design Notes",
      avatar: "R",
      lastMessage: "Deleted message",
      time: "Yesterday",
      pinned: false,
      messages: [
        { id: "a1", from: "them", type: "deleted", body: "This message was deleted", time: "Yesterday", status: "read" },
      ],
    },
  ],
};
