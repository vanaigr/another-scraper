import fs from 'node:fs'
import * as U from './lib/util.ts'
import * as L from './lib/log.ts'
import puppeteer from './puppeteer.ts'
import * as P from './prisma.ts'

const browser = await puppeteer.launch({
    headless: false,
    //headless: true,
    args: ['--no-sandbox'],
})
browser.setCookie(...JSON.parse(fs.readFileSync('data/cookies.txt').toString()))
const page = await browser.newPage()
await page.setBypassCSP(true)

/*
await page.goto('https://www.linkedin.com/jobs/search-results')
const inputSelector = 'input[placeholder="Describe the job you want"]'
await page.waitForSelector(inputSelector)
await page.type(inputSelector, 'full stack')
await page.focus(inputSelector);
await page.keyboard.press('Enter');
*/
await page.goto('https://www.linkedin.com/jobs/search-results/?keywords=full%20stack&f_TPR=r86400&f_SAL=f_SA_id_225001%3A272001')

const now = Date.now()

let i = 1
outer: while(true) {
    const listSelector = '[componentkey="SearchResultsMainContent"]'
    const cardSelector = 'div[data-display-contents="true"][style]'

    await page.waitForSelector(listSelector)
    console.log('Checking page', i)

    const jobCount = await page.evaluate(({ listSelector, cardSelector }) => {
        return document.querySelectorAll(`${listSelector} > ${cardSelector}`).length
    }, { listSelector, cardSelector })

    for(let j = 0; j < jobCount; j++) {
        console.log('Checking job', j)

        await page.evaluate(({ listSelector, cardSelector, j }) => {
            const card = document.querySelectorAll(`${listSelector} > ${cardSelector}`)[j]
            ;(card!.childNodes[0]!.childNodes[0]!.childNodes[0]! as any).click()
        }, { listSelector, cardSelector, j })

        await U.delay(1)
        const jobDescCont = '[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]'
        await page.waitForSelector(`${jobDescCont} [aria-label="More options"]`)
        await page.waitForSelector(`${jobDescCont} [data-testid="expandable-text-box"]`)

        const jobDetailsRaw = await page.evaluate(({ listSelector, cardSelector, j, jobDescCont }) => {
            const linkEls = document.querySelectorAll(`${jobDescCont} a`)
            const companyEl = linkEls[1]
            const titleEl = linkEls[2]
            const descEl = document.querySelector('[data-testid="expandable-text-box"]')
            const locationEl = document.querySelectorAll(`${listSelector} > ${cardSelector}`)[j]!.querySelectorAll('p')[2]

            return {
                id: new URL('' + window.location).searchParams.get('currentJobId')!,
                companyUrl: companyEl.getAttribute('href')!,
                companyTitle: companyEl.textContent,
                roleTitle: titleEl.textContent,
                location: locationEl.textContent,
                descriptionHtml: descEl!.innerHTML,
                description: descEl!.textContent.replace(/\s+/, ' ').trim(),
            }
        }, { listSelector, cardSelector, j, jobDescCont })
        const jobDetails: P.job = {
            id: jobDetailsRaw.id,
            time: now,
            companyUrl: jobDetailsRaw.companyUrl,
            companyName: jobDetailsRaw.companyTitle,
            jobTitle: jobDetailsRaw.companyTitle,
            jobLocation: jobDetailsRaw.location,
            jobDescription: jobDetailsRaw.description,
            jobDescriptionHtml: jobDetailsRaw.descriptionHtml,
        }

        console.log('saving job details')
        await P.prisma.job.upsert({
            where: { id: jobDetails.id },
            create: jobDetails,
            update: jobDetails,
        })
    }

    try {
        await page.click('[data-testid="pagination-controls-next-button-visible"]')
        await U.delay(5)
    }
    catch(err) {
        console.log('No next page')
        break
    }
}

console.log('done')
await browser.close()
