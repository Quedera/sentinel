import type {
  Consultant,
  Client,
  Engagement,
  AuditEvent,
  SearchFilters,
} from "./types";

export const mockConsultants: Consultant[] = [
  {
    id: "c1",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+44 7700 900123",
    location: "UK / Remote",
    title: "Transformation Consultant",
    yearsExperience: 15,
    primarySector: "Financial Services",
    professionalSummary:
      "Experienced transformation leader specialising in financial services, technology and operational change. Track record of delivering large-scale programmes for FTSE 100 clients.",
    skills: ["Transformation", "Programme Management", "Strategy", "Change", "PMO"],
    dayRate: 1250,
    cvFile: "consultant_cv.pdf",
    references: [
      {
        id: "r1",
        name: "Mark Thompson",
        organisation: "Barclays",
        position: "Chief Operating Officer",
        email: "mark.thompson@barclays.example",
        phone: "+44 20 7000 0001",
      },
      {
        id: "r2",
        name: "Helen Green",
        organisation: "Lloyds Banking Group",
        position: "Director of Change",
        email: "helen.green@lloyds.example",
        phone: "+44 20 7000 0002",
      },
    ],
    verified: true,
    profileComplete: true,
    availability: {
      "2026-09-01": "available",
      "2026-09-02": "available",
      "2026-09-03": "available",
      "2026-09-04": "available",
      "2026-09-15": "unavailable",
      "2026-09-16": "unavailable",
      "2026-09-17": "unavailable",
      "2026-09-18": "unavailable",
    },
  },
  {
    id: "c2",
    fullName: "David Jones",
    email: "david.jones@example.com",
    phone: "+44 7700 900456",
    location: "UK / Remote",
    title: "Programme Director",
    yearsExperience: 12,
    primarySector: "Technology",
    professionalSummary:
      "Programme director with deep experience in technology transformation, PMO setup, and stakeholder management across regulated industries.",
    skills: ["PMO", "Transformation", "Technology", "Stakeholder Management"],
    dayRate: 1100,
    cvFile: "djones_cv.pdf",
    references: [
      {
        id: "r3",
        name: "Sarah Williams",
        organisation: "HSBC",
        position: "Head of Technology",
        email: "sarah.williams@hsbc.example",
        phone: "+44 20 7000 0003",
      },
    ],
    verified: true,
    profileComplete: true,
    availability: {
      "2026-09-03": "available",
      "2026-09-04": "available",
      "2026-09-07": "available",
      "2026-09-08": "available",
      "2026-09-09": "available",
      "2026-09-10": "available",
    },
  },
  {
    id: "c3",
    fullName: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+44 7700 900789",
    location: "London",
    title: "Finance Transformation Lead",
    yearsExperience: 10,
    primarySector: "Financial Services",
    professionalSummary:
      "Chartered accountant turned transformation lead. Specialises in finance operating model design, ERP implementations, and cost reduction programmes.",
    skills: ["Finance", "Transformation", "ERP", "Cost Reduction"],
    dayRate: 950,
    cvFile: "psharma_cv.pdf",
    references: [],
    verified: true,
    profileComplete: true,
    availability: {
      "2026-09-08": "available",
      "2026-09-09": "available",
      "2026-09-22": "available",
      "2026-09-23": "available",
    },
  },
  {
    id: "c4",
    fullName: "Tom Bennett",
    email: "tom.bennett@example.com",
    phone: "+44 7700 900321",
    location: "Manchester",
    title: "Cyber Security Consultant",
    yearsExperience: 8,
    primarySector: "Technology",
    professionalSummary:
      "Cyber security specialist with experience across banking, defence and government. GCHQ-cleared, NCSC CCP-certified.",
    skills: ["Cyber Security", "Risk", "Compliance", "ISO 27001"],
    dayRate: 1050,
    references: [],
    verified: false,
    profileComplete: false,
    availability: {},
  },
];

export const mockClients: Client[] = [
  {
    id: "cl1",
    companyName: "ABC Corporation",
    contactName: "Sarah Mitchell",
    email: "sarah.mitchell@abc-corp.example",
  },
];

export const mockEngagements: Engagement[] = [
  {
    id: "e1",
    consultantId: "c1",
    clientId: "cl1",
    role: "Transformation Consultant",
    startDate: "2026-09-01",
    endDate: "2026-09-10",
    estimatedDays: 8,
    dayRate: 1250,
    estimatedValue: 10000,
    status: "AWAITING_CONSULTANT",
    contractFile: "Jane_Smith_Consulting_Agreement.pdf",
    consultantDeadline: "2026-08-19T17:00:00Z",
  },
  {
    id: "e2",
    consultantId: "c2",
    clientId: "cl1",
    role: "Programme Director",
    startDate: "2026-09-15",
    endDate: "2026-09-22",
    estimatedDays: 6,
    dayRate: 1100,
    estimatedValue: 6600,
    status: "CONFIRMED",
    signedAt: "2026-08-13T15:30:00Z",
  },
];

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "a1",
    timestamp: "2026-08-12 14:23",
    actor: "jane.smith@example.com",
    action: "CV_UPLOADED",
    resourceType: "consultant",
    resourceId: "c1",
    details: "consultant_cv.pdf",
  },
  {
    id: "a2",
    timestamp: "2026-08-12 14:30",
    actor: "jane.smith@example.com",
    action: "REFERENCE_ADDED",
    resourceType: "consultant",
    resourceId: "c1",
  },
  {
    id: "a3",
    timestamp: "2026-08-13 09:15",
    actor: "sarah.mitchell@abc-corp.example",
    action: "SEARCH_PERFORMED",
    resourceType: "search",
    resourceId: "s1",
    details: "skills=Transformation;sector=Financial Services",
  },
  {
    id: "a4",
    timestamp: "2026-08-14 11:42",
    actor: "sarah.mitchell@abc-corp.example",
    action: "HIRE_REQUESTED",
    resourceType: "engagement",
    resourceId: "e1",
  },
  {
    id: "a5",
    timestamp: "2026-08-14 12:05",
    actor: "sarah.mitchell@abc-corp.example",
    action: "CONTRACT_UPLOADED",
    resourceType: "engagement",
    resourceId: "e1",
    details: "Jane_Smith_Consulting_Agreement.pdf",
  },
  {
    id: "a6",
    timestamp: "2026-08-15 16:30",
    actor: "admin@quedera.example",
    action: "CONSULTANT_APPROVED",
    resourceType: "consultant",
    resourceId: "c2",
  },
  {
    id: "a7",
    timestamp: "2026-08-16 10:11",
    actor: "sarah.mitchell@abc-corp.example",
    action: "CONTRACT_VIEWED",
    resourceType: "engagement",
    resourceId: "e1",
  },
];

export const mockSearchFilters: SearchFilters = {
  skills: "Programme Management",
  sector: "Financial Services",
  experience: "10+ years",
  availableFrom: "2026-09-01",
  maxDayRate: 1500,
  location: "UK / Remote",
};

export function getConsultant(id: string): Consultant | undefined {
  return mockConsultants.find((c) => c.id === id);
}

export function getEngagement(id: string): Engagement | undefined {
  return mockEngagements.find((e) => e.id === id);
}

export function getClient(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id);
}

export function getEngagementsForConsultant(consultantId: string): Engagement[] {
  return mockEngagements.filter((e) => e.consultantId === consultantId);
}

export function getEngagementsForClient(clientId: string): Engagement[] {
  return mockEngagements.filter((e) => e.clientId === clientId);
}
