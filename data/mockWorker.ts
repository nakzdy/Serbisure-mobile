export type MockApplication = {
  id: string;
  requestId: string;
  workerName: string;
  serviceType: string;
  date: string;
  homeownerName: string;
  status: 'Applied' | 'Accepted' | 'Declined' | 'Completed';
};

export type MockBooking = {
  id: string;
  workerId: string;
  workerName: string;
  homeownerName?: string;
  skills: string[];
  reliability: number;
  requestId?: string;
  serviceType?: string;
  serviceDate?: string;
  estimatedCost?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
};

export const INITIAL_APPLICATIONS: MockApplication[] = [
  {
    id: 'app-1',
    requestId: 'req-1',
    workerName: 'Worker',
    serviceType: 'Plumbing',
    date: 'March 18, 2026 2:00 PM',
    homeownerName: 'Rhoydel Jr Elan',
    status: 'Applied',
  },
  {
    id: 'app-2',
    requestId: 'req-3',
    workerName: 'Worker',
    serviceType: 'Electrical',
    date: 'March 17, 2026 9:00 AM',
    homeownerName: 'Rhoydel Jr Elan',
    status: 'Accepted',
  },
  {
    id: 'app-3',
    requestId: 'req-4',
    workerName: 'Worker',
    serviceType: 'Cleaning',
    date: 'March 14, 2026 11:00 AM',
    homeownerName: 'Rhoydel Jr Elan',
    status: 'Completed',
  },
];

export const INITIAL_BOOKINGS: MockBooking[] = [
  {
    id: 'book-1',
    workerId: 'w-1',
    workerName: 'Worker',
    homeownerName: 'Rhoydel Jr Elan',
    skills: ['Electrical'],
    reliability: 92,
    requestId: 'req-3',
    serviceType: 'Electrical',
    serviceDate: 'March 17, 2026 9:00 AM',
    estimatedCost: '$120',
    createdAt: 'March 16, 2026 5:30 PM',
    status: 'Confirmed',
  },
  {
    id: 'book-2',
    workerId: 'w-1',
    workerName: 'Worker',
    homeownerName: 'Rhoydel Jr Elan',
    skills: ['Cleaning'],
    reliability: 90,
    requestId: 'req-4',
    serviceType: 'Cleaning',
    serviceDate: 'March 14, 2026 11:00 AM',
    estimatedCost: '$60',
    createdAt: 'March 13, 2026 8:15 AM',
    status: 'Completed',
  },
  {
    id: 'book-3',
    workerId: 'w-1',
    workerName: 'Worker',
    homeownerName: 'Carla Mendoza',
    skills: ['Plumbing'],
    reliability: 88,
    requestId: 'req-5',
    serviceType: 'Plumbing',
    serviceDate: 'March 19, 2026 1:00 PM',
    estimatedCost: '$85',
    createdAt: 'March 16, 2026 6:00 PM',
    status: 'Pending',
  },
];
