export type Match = {
  id: string;
  name: string;
  age: number;
  city: string;
  distanceKm: number;
  interests: string[];
  about: string;
};

export const sampleMatches: Match[] = [
  {
    id: "maya-62",
    name: "Maya",
    age: 62,
    city: "Singapore",
    distanceKm: 6,
    interests: ["Gardening", "Hawker food", "Walks"],
    about:
      "I love slow mornings, plants, and long chats. Looking for someone kind and steady.",
  },
  {
    id: "daniel-68",
    name: "Daniel",
    age: 68,
    city: "Singapore",
    distanceKm: 4,
    interests: ["Jazz", "Museums", "Cooking"],
    about:
      "Retired teacher. I enjoy museums and cooking new recipes. Coffee dates welcome.",
  },
  {
    id: "lina-65",
    name: "Lina",
    age: 65,
    city: "Singapore",
    distanceKm: 9,
    interests: ["Swimming", "K-dramas", "Family"],
    about:
      "Easy-going and family-oriented. I like quiet weekends and good humour.",
  },
];

export type ChatMessage = {
  id: string;
  role: "me" | "them";
  text: string;
  createdAtIso: string;
};

export const sampleChats: Record<string, ChatMessage[]> = {
  "maya-62": [
    {
      id: "m1",
      role: "them",
      text: "Hi! What do you like to do on weekends?",
      createdAtIso: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: "m2",
      role: "me",
      text: "I enjoy walks and trying new hawker stalls. How about you?",
      createdAtIso: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    },
  ],
  "daniel-68": [
    {
      id: "d1",
      role: "them",
      text: "Hello! I’m Daniel. Any favourite music?",
      createdAtIso: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    {
      id: "d2",
      role: "me",
      text: "Jazz and oldies. I also like movie soundtracks.",
      createdAtIso: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    },
  ],
  "lina-65": [
    {
      id: "l1",
      role: "them",
      text: "Hi there 🙂 I’m Lina. What are you looking for here?",
      createdAtIso: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ],
};

