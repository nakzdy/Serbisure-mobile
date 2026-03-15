export type HomeownerRequest = {
  id: string;
  title: string;
  category: string;
  date: string;
  est: string;
  homeownerName: string;
  status: 'Open' | 'Confirmed' | 'Completed' | 'Cancelled';
};

export const INITIAL_REQUESTS: HomeownerRequest[] = [
  {
    id: 'req-1',
    title: 'Pipe Repair',
    category: 'Plumbing',
    date: 'Today, 2:00 PM',
    est: '$85',
    homeownerName: 'Rhoydel Jr Elan',
    status: 'Open',
  },
  {
    id: 'req-2',
    title: 'Fixture Installation',
    category: 'Electrical',
    date: 'Tomorrow, 10:00 AM',
    est: '$120',
    homeownerName: 'Rhoydel Jr Elan',
    status: 'Open',
  },
];
