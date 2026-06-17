import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { SavedCity, SavedCompany, JobApplication, JobOffer, UserProfile } from '../types'

// ── Saved Cities ──────────────────────────────────────────────

export async function getSavedCities(userId: string): Promise<SavedCity[]> {
  const q = query(collection(db, 'savedCities'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      userId: data.userId,
      cityId: data.cityId,
      notes: data.notes ?? '',
      savedAt: (data.savedAt as Timestamp)?.toDate() ?? new Date(),
      cityData: data.cityData ?? undefined,
    }
  })
}

export async function saveCity(
  userId: string,
  cityId: string,
  notes = '',
  cityData?: import('../types').City,
): Promise<string> {
  const ref = await addDoc(collection(db, 'savedCities'), {
    userId,
    cityId,
    notes,
    ...(cityData ? { cityData } : {}),
    savedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCityNotes(docId: string, notes: string): Promise<void> {
  await updateDoc(doc(db, 'savedCities', docId), { notes })
}

export async function removeSavedCity(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'savedCities', docId))
}

// ── Saved Companies ───────────────────────────────────────────

export async function getSavedCompanies(userId: string): Promise<SavedCompany[]> {
  const q = query(collection(db, 'savedCompanies'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    // backward-compat: old records used city:string, new ones use offices:string[]
    const offices: string[] = Array.isArray(data.offices)
      ? data.offices
      : data.city ? [data.city] : []
    return {
      id: d.id,
      userId: data.userId,
      companyId: data.companyId ?? '',
      companyName: data.companyName,
      offices,
      industry: data.industry ?? '',
      notes: data.notes ?? '',
      priority: data.priority ?? 'Medium',
      hasApplied: data.hasApplied ?? false,
      careerPageUrl: data.careerPageUrl ?? '',
      savedAt: (data.savedAt as Timestamp)?.toDate() ?? new Date(),
      interviewRounds: data.interviewRounds ?? [],
    }
  })
}

export async function saveCompany(
  userId: string,
  payload: Omit<SavedCompany, 'id' | 'userId' | 'savedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'savedCompanies'), {
    userId,
    ...payload,
    savedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSavedCompany(
  docId: string,
  updates: Partial<Omit<SavedCompany, 'id' | 'userId' | 'savedAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'savedCompanies', docId), updates)
}

export async function removeSavedCompany(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'savedCompanies', docId))
}

// ── Job Applications ──────────────────────────────────────────

export async function getJobApplications(userId: string): Promise<JobApplication[]> {
  const q = query(collection(db, 'jobApplications'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      userId: data.userId,
      jobTitle: data.jobTitle,
      company: data.company,
      city: data.city ?? '',
      applicationUrl: data.applicationUrl ?? '',
      status: data.status,
      dateApplied: data.dateApplied ?? '',
      deadline: data.deadline ?? '',
      notes: data.notes ?? '',
      contactName: data.contactName ?? '',
      followUpDate: data.followUpDate ?? '',
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    }
  })
}

export async function addJobApplication(
  userId: string,
  payload: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'jobApplications'), {
    userId,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateJobApplication(
  docId: string,
  updates: Partial<Omit<JobApplication, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'jobApplications', docId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteJobApplication(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'jobApplications', docId))
}

// ── Job Offers ────────────────────────────────────────────────

export async function getJobOffers(userId: string): Promise<JobOffer[]> {
  const q = query(collection(db, 'jobOffers'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      userId: data.userId,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      city: data.city ?? '',
      state: data.state ?? '',
      salary: data.salary ?? 0,
      signingBonus: data.signingBonus ?? 0,
      equityPerYear: data.equityPerYear ?? 0,
      deadline: data.deadline ?? '',
      notes: data.notes ?? '',
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    }
  })
}

export async function addJobOffer(
  userId: string,
  payload: Omit<JobOffer, 'id' | 'userId' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'jobOffers'), {
    userId,
    ...payload,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateJobOffer(
  docId: string,
  updates: Partial<Omit<JobOffer, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'jobOffers', docId), updates)
}

export async function deleteJobOffer(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'jobOffers', docId))
}

// ── User Profile ──────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'userProfiles', userId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    experienceLevel: data.experienceLevel ?? 'new-grad',
    domainInterests: data.domainInterests ?? [],
  }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'userProfiles', userId), profile)
}
