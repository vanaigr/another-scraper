import * as P from '../prisma'
import { App, Job } from './page_but_client'

const bannedCompanies = [
    'Turing',
    'Crossing Hurdles',
    'Jobright.ai',
    'Jobs Ai',
    'Jobs via Dice',
    'Quik Hire Staffing',
    'Jack & Jill',
    'Stealth Startup',
    'Underdog.io -Apply to top tech jobs in 60 seconds. A place where companies apply to you',
]

const getYears = /(\d+)(\s*[-–—]\s*\d+)?\+? (years|experience)/g


export default async function() {
    const dbJobs = await P.prisma.job.findMany({
        where: {
            time: {
                gt: Date.now() - 24 * 60 * 60 * 1000,
            }
        }
    })
    const statuses = new Set((await P.prisma.status.findMany({ where: { id: { in: dbJobs.map(it => it.id) } } })).map(it => it.id))

    let type = 0
    let loc = 0
    let com = 0
    let title = 0

    const jobs: Job[] = []
    for(const dbJob of dbJobs) {
        if(statuses.has(dbJob.id)) continue

        const jobTitle = dbJob.jobTitle.toLowerCase()
        const desc = dbJob.jobDescription.toLowerCase()
        const years = (() => {
            const years = Math.max(...[...desc.matchAll(getYears)].map(it => Number.parseInt(it[1], 10)))
            if(years > 10) return -Infinity
            return years
        })()

        let match = true

        if(!(desc.includes('typescript') || desc.includes('type script'))) {
            match = false
            type++
        }
        if(!dbJob.jobLocation.toLowerCase().includes('united states')) {
            match = false
            loc++
        }
        if(bannedCompanies.includes(dbJob.companyName)) {
            match = false
            com++
        }
        if(/\b(lead|staff|principal|java|python|director)\b/.test(jobTitle)) {
            match = false
            title++
        }
        //if(years >= 5) continue

        if(!match) continue

        jobs.push({
            ...dbJob,
            years,
            clearance: desc.includes('clearance') || desc.includes('us citizen')
        })
    }

    console.log({ type, loc, com, title })

    return <App jobs={jobs}/>
}
