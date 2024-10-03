import express, { Request, Response } from "express";
import { chromium } from "playwright-chromium";
import { vendors } from "./vendors";
import { Apartment } from "./types";
import { Client } from "pg";
import { db } from "./db-config";

const app = express();
const port = process.env.PORT || 3000;

app.get("/apartments", async (req: Request, res: Response) => {
  const browser = await chromium.launch({ headless: false });
  let apartments: Apartment[] = [];

  for (const vendor of vendors) {
    const { url, path } = vendor;
    const page = await browser.newPage();

    const vendorApartments = await vendor.getApartments({ page, url, path });
    console.log(vendorApartments.length)
    apartments = apartments.concat(vendorApartments);

    await page.close();
  }

  console.log(apartments.length)

  await db.connect();

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS apartments (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          price VARCHAR(255) NOT NULL,
          address VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          CONSTRAINT unique_address UNIQUE (address)
      );
    `);
    console.log('Ejecutado 1')
  } catch (e) {
    await db.end();
    await browser.close();
    res.status(500).json({ error: e });
  }

  const records = apartments.map((apartment) => Object.values(apartment));
  const prices = records.map(record => record[0]);
  const addresses = records.map(record => record[1]);
  const locations = records.map(record => record[2]);
  const urls = records.map(record => record[3]);

  try {
    await db.query(
      `
      INSERT INTO apartments (price, address, location, url)
      SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::text[])
      ON CONFLICT (address) DO NOTHING
      `,
      [prices, addresses, locations, urls]
    );
  } catch (e) {
    console.error(e)
    await db.end();
    await browser.close();
    res.status(500).json({ error: e });
  }

  const currentDate = new Date().toISOString().slice(0, 10);

  try {
    const { rows } = await db.query(
      "SELECT price, address, location, url FROM apartments WHERE created_at::DATE = $1",
      [currentDate]
    );

    res.json({ apartments: rows})
  } catch (e) {
    res.status(500).json({ error: e });
  } finally {
    await db.end();
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
