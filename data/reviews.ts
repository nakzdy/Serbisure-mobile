export type Review = {
  id: string;
  name: string;
  rating: number;
  time: string;
  body: string;
};

export const REVIEWS: Review[] = [
  { id: '1', name: 'Alex M.', rating: 5, time: '2 days ago', body: '"Very professional and fixed the leak quickly!"' },
  { id: '2', name: 'David L.', rating: 5, time: '1 week ago', body: '"Good work, but arrived 10 mins late."' },
  { id: '3', name: 'Kara T.', rating: 4, time: '2 weeks ago', body: '"Clean and polite service. Would book again."' },
  { id: '4', name: 'Miguel S.', rating: 5, time: '3 weeks ago', body: '"Top-notch repair. Clear pricing and fast response."' },
];
