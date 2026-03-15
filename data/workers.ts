export type WorkerProfile = {
  id: string;
  name: string;
  skills: string[];
  status: 'online' | 'pending';
  reliability: number;
  verified: boolean;
  tesda: boolean;
  bio: string;
  years: number;
  location: string;
};

export const WORKERS: WorkerProfile[] = [
  {
    id: '1',
    name: 'Juana Dela Cruz',
    skills: ['Plumbing', 'Pipes', 'Drainage'],
    status: 'online',
    reliability: 92,
    verified: true,
    tesda: true,
    bio: 'Licensed plumber with residential and commercial repair experience.',
    years: 8,
    location: 'Quezon City',
  },
  {
    id: '2',
    name: 'Mario Rossi',
    skills: ['Electrical', 'Wiring', 'Lighting'],
    status: 'online',
    reliability: 85,
    verified: true,
    tesda: false,
    bio: 'Certified electrician focused on safe, code-compliant installs.',
    years: 6,
    location: 'Makati',
  },
  {
    id: '3',
    name: 'Maria Clara',
    skills: ['Cleaning', 'Janitorial'],
    status: 'pending',
    reliability: 60,
    verified: false,
    tesda: true,
    bio: 'Detail-oriented cleaner specializing in deep cleaning services.',
    years: 4,
    location: 'Pasig',
  },
  {
    id: '4',
    name: 'Roberto G.',
    skills: ['Carpentry', 'Furniture', 'Repair'],
    status: 'online',
    reliability: 95,
    verified: true,
    tesda: true,
    bio: 'Custom woodwork, repairs, and home improvement projects.',
    years: 10,
    location: 'Quezon City',
  },
  {
    id: '5',
    name: 'Elena R.',
    skills: ['Babysitting', 'Child Care'],
    status: 'online',
    reliability: 88,
    verified: true,
    tesda: false,
    bio: 'Experienced caregiver with child safety and activity planning.',
    years: 5,
    location: 'Taguig',
  },
  {
    id: '6',
    name: 'Paolo M.',
    skills: ['Pet Care', 'Dog Walking'],
    status: 'pending',
    reliability: 78,
    verified: false,
    tesda: false,
    bio: 'Pet-friendly helper with daily walking and basic grooming.',
    years: 3,
    location: 'Manila',
  },
];
