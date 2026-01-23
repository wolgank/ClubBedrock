export type CourseWithSchedule = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  capacity: number;
  urlImage: string;
  allowOutsiders: boolean;
  isActive: boolean;
  courseType: string | null;
  academyName: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  pricing: {
    id: number;
    numberDays: string;
    inscriptionPriceMember: string;
    inscriptionPriceGuest: string;
  }[];
};
