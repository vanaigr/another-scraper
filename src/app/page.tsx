import * as P from '../prisma'
import { App, Job } from './page_but_client'

const bannedCompanies = [
    'Turing',
    'DataAnnotation',
    'Meridial Marketplace, by Invisible',
    'Twine',

    'Crossing Hurdles',
    'Jobright.ai',
    'Jobs Ai',
    'Ladders',
    'Jobs via Dice',
    'Jack & Jill',
    'Stealth Startup',
    'RemoteHunter',
    'Sundayy',
    'Underdog.io -Apply to top tech jobs in 60 seconds. A place where companies apply to you',
    'Jobgether',
    'FetchJobs.co',

    'Quik Hire Staffing',
    'Recruiting from Scratch',
    'Haystack',
    'Applicantz',

    // ask more questions
    'Rally',
    'CFRA Research',
]

const getYears = /(\d+)(\s*[-–—]\s*\d+)?\+? (years|experience)/g


export default async function() {
    const dbJobs = await P.prisma.job.findMany({
        where: {
            time: {
                gt: Date.now() - 5 * 60 * 60 * 1000,
            }
        }
    })
    const statuses = new Set((await P.prisma.status.findMany({ where: { id: { in: dbJobs.map(it => it.id) } } })).map(it => it.id))

    let matchStrict = 0
    let matchLoose = 0
    let loc = 0
    let com = 0
    let title = 0
    let experience = 0

    const jobs: Job[] = []
    for(const dbJob of dbJobs) {
        if(statuses.has(dbJob.id)) continue

        const jobTitle = dbJob.jobTitle.toLowerCase()
        const desc = dbJob.jobDescription.toLowerCase()
        const years = (() => {
            return Math.max(...[...desc.matchAll(getYears)].map(it => Number.parseInt(it[1], 10)).filter(it => it <= 10))
        })()

        let match = true

        const strictTypescript = desc.includes('typescript') || desc.includes('type script')
        const looseTypeScript = desc.includes('node.js') || desc.includes('nodejs') || desc.includes('react.js') || desc.includes('reactjs')

        if(strictTypescript) matchStrict++
        if(looseTypeScript) matchLoose++

        if(!(strictTypescript || looseTypeScript)) {
            match = false
        }
        if(!dbJob.jobLocation.toLowerCase().includes('united states')) {
            match = false
            loc++
        }
        if(bannedCompanies.includes(dbJob.companyName)) {
            match = false
            com++
        }
        if(/\b(lead|staff|principal|java|python|director|manager|head of|servicenow|intern|internship)\b/.test(jobTitle)) {
            match = false
            title++
        }
        if(years >= 5) {
            match = false
            experience++
        }

        if(!match) continue

        jobs.push({
            ...dbJob,
            years,
            clearance: desc.includes('clearance') || desc.includes('us citizen') || desc.includes('u.s. citizen')
        })
    }

    console.log({ length: dbJobs.length, loc, com, title })

    return <App jobs={jobs}/>
}
