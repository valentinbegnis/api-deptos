import { Page } from 'playwright-chromium'
import { Apartment } from './types'

interface Props {
  page: Page
  url: string
  path: string
}

export const argenpropScraper = async ({ page, url, path }: Props): Promise<Apartment[]> => {
  const pageUrl = `${url}/${path}`
  await page.goto(pageUrl)

  let currentPage = 1
  const pageNumbers = (await page.$$('.pagination__page')).length - 2
  const candidates = []

  while(currentPage <= pageNumbers) {
    const apartments = await page.$$('.listing__item')
    
    for (const apartment of apartments) {
      const priceElement = await apartment.$('.card__price')
      const addressElement = await apartment.$('.card__address')
      const locationElement = await apartment.$('.card__title--primary')
      const anchorElement = await apartment.$('a')
      
      
      if (anchorElement && priceElement && addressElement && locationElement) {
        const price = await priceElement.innerText()
        const address = await addressElement.innerText()
        const location = await locationElement.innerText()
        const apartmentUrl = await anchorElement.getAttribute('href')
        candidates.push({ price, address, location, url: apartmentUrl ? `${url}${apartmentUrl}` : '' })
      }
    }
    
    await page.goto(`${pageUrl}?pagina-${++currentPage}`)
  }
  
  return candidates
}

export const zonapropScraper = async ({ page, url, path }: Props): Promise<Apartment[]> => {
  const pageUrl = `${url}/${path}`
  const candidates: Apartment[] = []

  await page.goto(pageUrl)

  if (await page.getByText('En este momento no hay propiedades como la que buscás').isVisible()) {
    return candidates
  }
  
  const apartmentsHandle = await page.$$('[data-posting-type="PROPERTY"]')

  for (const apartment of apartmentsHandle) {
    const priceHandle = await apartment.$('[data-qa="POSTING_CARD_PRICE"]')
    const addressHandle = await apartment.$('.postingAddress')
    const locationHandle = await apartment.$('[data-qa="POSTING_CARD_LOCATION"]')
    const apartmentUrl = await apartment.getAttribute('data-to-posting')

    if (priceHandle && addressHandle && locationHandle && apartmentUrl) {
      const price = await priceHandle.innerText()
      const address = await addressHandle.innerText()
      const location = await locationHandle.innerText()

      candidates.push({ price, address, location, url: `${url}${apartmentUrl}` })
    }
  }

  return candidates
}

export const remaxScraper = async ({ page, url, path }: Props): Promise<Apartment[]> => {
  let pageNumber = 0
  const candidates = []

  while (true) {
    await page.goto(`${url}/listings/rent?page=${pageNumber}${path}`)
    await page.locator('.results-container').waitFor({ state: 'attached' })

    const apartmentsHandle = await page.$$('.card-remax viewList')

    if (apartmentsHandle.length === 0) {
      break
    }

    for (const apartment of apartmentsHandle) {
      const priceHandle = await apartment.$('#price')
      const expensesHandle = await apartment.$('#expenses')
      const addressLocationHandle = await apartment.$('.description.ng-star-inserted')

      if (priceHandle && addressLocationHandle) {
        const price = await priceHandle.innerText()
        const expenses = expensesHandle ? await expensesHandle.innerText() : ''
        const addressLocation = await addressLocationHandle.innerText()

        const totalPrice = `${price} ${expenses}`.trim()

        let [fullAddress, location] = addressLocation.split(',')
        let [, address] = fullAddress.split('en alquiler en')
        address = address.trim()
        location = location.trim()

        const popupPromise = page.waitForEvent('popup')
        await apartment.click()
        const popup = await popupPromise
        const apartmentUrl = popup.url()
        await popup.close()

        candidates.push({ price: totalPrice, address, location, url: apartmentUrl })
      }
    }

    pageNumber++
  }

  return candidates
}
