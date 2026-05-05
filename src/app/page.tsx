import * as P from '../prisma'
import { App, Job } from './page_but_client'

const bannedCompanies = [
    'Turing',
    'DataAnnotation',
    'Meridial Marketplace, by Invisible',
    'Twine',
    'micro1', // don't worry, you are not our free training data
    'Alignerr',
    'CyberCoders',

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
    'AgileGrid Solutions', // best job tool
    'Joinrs',
    'Company Confidential',

    'Quik Hire Staffing',
    'Recruiting from Scratch',
    'Haystack',
    'Applicantz',
    'Motion Recruitment',
    'TalentAlly',

    // ask more questions
    'Rally',
    'CFRA Research',
    'Owner.com',
    'ShipBob',
    'CareMetx, LLC',

    // spammy
    'Veeva Systems',
    'Affirm',
    'CapitalOne', // TODO: 2 words?

    'Microsoft',
]

const getYears = /(\d+)(\s*[-–—]\s*\d+)?\+? (yrs|years|experience)/g

const bstences = [
    'Role:',
    'Location:',
    'Payout:',
    'Role Overview:',
    'Key Responsibilities:',
    'Remote (Work from Anywhere)',
    'Required Skills & Qualifications:',
    'We hire based on skills and expertise. All qualified candidates are welcome regardless of background, experience, or prior employment history. Applications are reviewed solely on demonstrated technical ability and qualifications',
    'Apply Now!',
].map(it => it.toLowerCase())

export default async function() {
    const dbJobs = await P.prisma.job.findMany({
        where: {
            time: {
                gt: Date.now() - 3 * 60 * 60 * 1000,
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
    let bs = 0

    const jobs: Job[] = []
    for(const dbJob of dbJobs) {
        if(statuses.has(dbJob.id)) continue

        const jobTitle = dbJob.jobTitle.toLowerCase()
        const desc = dbJob.jobDescription.toLowerCase()
        const years = (() => {
            return Math.max(...[...desc.matchAll(getYears)].map(it => Number.parseInt(it[1], 10)).filter(it => it <= 10))
        })()
        const location = dbJob.jobLocation.toLowerCase()

        let match = true

        const strictTypescript = desc.includes('typescript') || desc.includes('type script')
        const looseTypeScript = dbJob.jobDescription.includes('Node')
            || desc.includes('nodejs')
            || dbJob.jobDescription.includes('React')
            || desc.includes('react')

        if(strictTypescript) matchStrict++
        if(looseTypeScript) matchLoose++

        if(!(strictTypescript || looseTypeScript)) {
            match = false
        }

        if(!(
            (location.includes('united states') && !location.includes('on-site') && !location.includes('hybrid'))
                || dbJob.jobLocation.includes('IL')
                || location.includes('illinois')
                //|| location.includes('remote')
        )) {
            match = false
            loc++
        }
        if(bannedCompanies.includes(dbJob.companyName)) {
            match = false
            com++
        }
        if(/\b(intern|internship|lead|staff|director|principal|head of|manager|sdet|java|python|ruby|servicenow|qa|tutor|instructor)\b/.test(jobTitle)) {
            match = false
            title++
        }
        /*
        if(years >= 5) {
            match = false
            experience++
        }
        */

        const bs1 = /Role: [\s\S]*?Location: Remote \(Work from Anywhere\)[\s\S]*?Payout: [\s\S]*?Role Overview:[\s\S]*?Key Responsibilities:[\s\S]+?Required Skills & Qualifications:[\s\S]*?Equal Opportunity Employer:[\s\S]*?We hire based on skills and expertise\. All qualified candidates are welcome regardless of background, experience, or prior employment history\. Applications are reviewed solely on demonstrated technical ability and qualifications\.[\s\S]*?Apply Now!/.test(dbJob.jobDescription)
        const bs2 = bstences.filter(sentence => desc.includes(sentence)).length === bstences.length

        if(bs1) {
            bs++
            match = false
        }
        if(bs1 !== bs2) console.log('!!!', dbJob.jobDescription)

        if(!match) continue

        jobs.push({
            ...dbJob,
            years,
            clearance: desc.includes('clearance') || desc.includes('us citizen') || desc.includes('u.s. citizen')
        })
    }


    console.log({
        length: dbJobs.length,
        mismatchStrict: dbJobs.length - matchStrict,
        mismatchLoose: dbJobs.length - matchLoose,
        loc,
        com,
        title,
        bs,
        result: jobs.length,
    })

    return <App jobs={jobs}/>
}
