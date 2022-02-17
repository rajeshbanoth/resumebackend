var express = require('express')
var cors= require('cors');
var bodyParser= require('body-parser')
const puppeteer = require('puppeteer');

const app= express()

app.use(cors())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const baseurl="https://plastic-wasp-53.loca.lt/r/"

const BASE_URL = 'https://plastic-wasp-53.loca.lt/r/';



function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


/**
 * Tries to navigate the page to a given URL.
 *
 * @param {puppeteer.Page} page Page.
 * @param {string} url URL to navigate page to.
 * @param {puppeteer.PuppeteerLifeCycleEvent} waitUntil When to consider navigation succeeded.
 * @returns {Promise<string>} Returns null if no error occurred, otherwise returns the error message.
 */
 const tryGotoPage = async (page, url, waitUntil) => {
    let httpResponse;
  
    try {
      httpResponse = await page.goto(url, {
        waitUntil,
      });
    } catch (error) {
      return `page.goto (waitUntil: "${waitUntil}") threw an error with message "${error.message}"`;
    }
  
    if (httpResponse === null) {
      return `page.goto (waitUntil: "${waitUntil}") returned a null response`;
    }
  
    if (!httpResponse.ok()) {
      return `page.goto (waitUntil: "${waitUntil}") returned a response with HTTP status ${httpResponse.status()} "${httpResponse.statusText()}"`;
    }
  
    return null;
  };
  
  /**
   * Creates a page and navigates to a given URL.
   *
   * @param {puppeteer.Browser} browser Browser.
   * @param {string} url URL to navigate to.
   * @returns {Promise<{page: puppeteer.Page, errors: string[]}>} Returns an object with the page if no error occurred, otherwise returns an object with the list of error messages.
   */
  const gotoPage = async (browser, url) => {
    const errors = [];
  
    const waitUntilArray = ['networkidle0', 'networkidle2'];
    for (let index = 0; index < waitUntilArray.length; index++) {
      /* eslint-disable no-await-in-loop */
      const waitUntil = waitUntilArray[index];
  
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
  
      const error = await tryGotoPage(page, url, waitUntil);
      if (!error) {
        return { page, errors: null };
      }
  
      errors.push(error);
      await page.close();
    }
  
    return { page: null, errors };
  };
  
 

app.post('/',async(req,res)=>{
    const id=req.body.id;
    const type=req.body.type;

    
    console.log(type)
    if (!id) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with argument "id" containing the resume ID.',
      );
    }
  
    if (!type) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with argument "type" containing the type of resume.',
      );
    }

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
  
      const url = BASE_URL + id;
      const { page, errors } = await gotoPage(browser, url);
      if (errors && errors.length > 0) {
        throw new Error(errors.join(' - '));
      }
  
      await timeout(6000);
      await page.emulateMediaType('print');
      let pdf;
  
      if (type === 'single') {
        const height = await page.evaluate(() => {
          const { body } = document;
          const html = document.documentElement;
  
          const maxHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight,
          );
  
          return maxHeight;
        });
        pdf = await page.pdf({
          printBackground: true,
          width: `21cm`,
          height: `${height}px`,
          pageRanges: '1',
        });
      } else {
        pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
      }
  
      await browser.close();
     res.send(Buffer.from(pdf).toString('base64'));
    } catch (error) {
      console.log(error)
    }

   

})



app.listen(7000,()=>{
    console.log("listening on 7000")
})





