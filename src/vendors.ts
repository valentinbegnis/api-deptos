import { argenprop, zonaprop, remax } from './constants'
import { argenpropScraper, zonapropScraper, remaxScraper } from './scrapers'

export const vendors = [
  {
    name: 'ARGENPROP',
    url: argenprop.url,
    path: argenprop.path,
    getApartments: argenpropScraper
  },
  {
    name: 'ZONAPROP',
    url: zonaprop.url,
    path: zonaprop.path,
    getApartments: zonapropScraper
  },
  // {
  //   name: 'REMAX',
  //   url: remax.url,
  //   path: remax.path,
  //   getApartments: remaxScraper
  // }
]
