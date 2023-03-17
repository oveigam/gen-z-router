type PowerRanger = {
  id: number;
  name: string;
  seasons: {
    season: "1" | "2" | "3" | "zeo";
    color: "red" | "yellow" | "black" | "pink" | "blue" | "green" | "white" | "gold";
  }[];
};

const data: PowerRanger[] = [
  {
    id: 1,
    name: "Jason Lee Scott",
    seasons: [
      { season: "1", color: "red" },
      { season: "2", color: "red" },
      { season: "zeo", color: "gold" },
    ],
  },
  {
    id: 2,
    name: "Trini Kwan",
    seasons: [
      { season: "1", color: "yellow" },
      { season: "2", color: "yellow" },
    ],
  },
  {
    id: 3,
    name: "Zack Taylor",
    seasons: [
      { season: "1", color: "black" },
      { season: "2", color: "black" },
    ],
  },
  {
    id: 4,
    name: "Kimberly Hart",
    seasons: [
      { season: "1", color: "pink" },
      { season: "2", color: "pink" },
      { season: "3", color: "pink" },
    ],
  },
  {
    id: 5,
    name: "Billy Cranston",
    seasons: [
      { season: "1", color: "blue" },
      { season: "2", color: "blue" },
      { season: "3", color: "blue" },
    ],
  },
  {
    id: 6,
    name: "Tommy Oliver",
    seasons: [
      { season: "1", color: "green" },
      { season: "2", color: "white" },
      { season: "2", color: "white" },
      { season: "zeo", color: "red" },
    ],
  },
];

export const db = {
  async findAll() {
    return data;
  },

  async findById(id: number) {
    return data.find((pr) => pr.id === id);
  },

  async search(name: string) {
    return data.filter((pr) => pr.name.toLowerCase().includes(name.toLowerCase()));
  },

  async create(pr: { name: string }) {
    const id = data.length ? data[data.length - 1].id + 1 : 1;
    const newPr = { id, name: pr.name, seasons: [] };
    data.push(newPr);
    return newPr;
  },

  async update(pr: { id: number; name: string }) {
    const index = data.findIndex(({ id }) => pr.id === id);
    data[index].name = pr.name;
    return pr;
  },

  async deleteMany(ids: number[]) {
    return data.filter((pr) => !ids.includes(pr.id));
  },

  async delete(id: number) {
    return data.filter((pr) => pr.id !== id);
  },
};
