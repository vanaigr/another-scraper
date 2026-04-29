'use client'
import R from 'react'
import * as A from './actions'

export type Job = {
    id: string
    jobTitle: string
    companyName: string
    jobDescriptionHtml: string
    years: number
    clearance: boolean
}

export function App({ jobs: jobs0 }: { jobs: Job[] }) {
    const [jobs, setJobs] = R.useState(jobs0)
    const [selected, setSelected] = R.useState<Job | undefined>(undefined)

    return <div className='max-h-full flex flex-1'>
        <div className='w-80 flex flex-col overflow-y-scroll'>
            {jobs.map(it => {
                return <button
                    key={it.id}
                    className={'text-left p-2' + (it === selected ? ' bg-blue-200' : '')}
                    onClick={() => setSelected(it)}
                >
                    <div className='flex items-start'>
                        <div>{it.jobTitle}</div>
                        <div className='flex-1'/>
                        <button
                            onClick={() => {
                                A.markHidden(selected.id)
                                setJobs(jobs.filter(it => it !== selected))
                            }}
                        >
                            X
                        </button>
                    </div>
                    <div className='text-sm'>{it.companyName}</div>
                    <div className='flex flex-wrap gap-2'>
                        {it.years !== -Infinity && <div>{it.years} years</div>}
                        {it.clearance && <div className='bg-yellow-400'>clearance</div>}
                    </div>
                </button>
            })}
        </div>
        <div className='flex flex-1 p-4 overflow-y-scroll'>
            {(() => {
                if(!selected) return

                const url = new URL(
                    'https://www.linkedin.com/jobs/search-results/?&keywords=full%20stack%20engineer%20united%20states&origin=JOB_SEARCH_PAGE_JOB_FILTER&referralSearchId=0lPA8naTDxzcNuosGCX9WA%3D%3D&geoId=103644278&distance=0.0&f_TPR=r86400&f_AL=true&f_SAL=f_SA_id_225001%3A272001'
                )
                url.searchParams.set('currentJobId', selected.id)

                let html = selected.jobDescriptionHtml
                html = html.replaceAll(/(clearance|us citizen|u\.s\. citizen)/ig, (it) => {
                    return `<span class="bg-yellow-400">${it}</span>`
                })

                return <div>
                    <div className='flex gap-2 mb-4'>
                        <button
                            className='text-white bg-blue-400 px-4 py-2'
                            onClick={() => {
                                window.open(url.toString(), '_blank')
                            }}
                        >
                            Apply
                        </button>
                        <button
                            className='text-white bg-green-400 px-4 py-2'
                            onClick={() => {
                                A.markApplied(selected.id)
                                setJobs(jobs.filter(it => it !== selected))
                            }}
                        >
                            Mark Applied
                        </button>
                        <button
                            className='text-white bg-red-400 px-4 py-2'
                            onClick={() => {
                                A.markHidden(selected.id);
                                setJobs(jobs.filter(it => it !== selected));
                            }}
                        >
                            Hide
                        </button>
                    </div>

                    <div dangerouslySetInnerHTML={{ __html: html }}/>
                </div>
            })()}
        </div>
    </div>

}
