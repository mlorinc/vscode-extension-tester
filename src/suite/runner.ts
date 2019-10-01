'use strict';

import { VSBrowser } from '../webdriver/browser';
import * as fs from 'fs-extra';
import Mocha = require('mocha');
import * as glob from 'glob';

/**
 * Mocha runner wrapper
 */
export class VSRunner {
    private chromeBin: string;
    private customSettings: Object;
    private codeVersion: string;

    constructor(bin: string, codeVersion: string, customSettings: Object = {}) {
        this.chromeBin = bin;
        this.customSettings = customSettings;
        this.codeVersion = codeVersion;
    }

    /**
     * Set up mocha suite, add vscode instance handling, run tests
     * @param testFilesPattern glob pattern of test files to run
     * @returns promise which resolves with number of failures
     */
    runTests(testFilesPattern: string): Promise<number> {
        const mocha = new Mocha();

        let self = this;
        let browser: VSBrowser = new VSBrowser(this.codeVersion, this.customSettings);
        const universalPattern = testFilesPattern.replace(/'/g, '');
        const testFiles = glob.sync(universalPattern);

        testFiles.forEach((file) => {
            if (fs.existsSync(file) && file.endsWith('.js')) {
                mocha.addFile(file);
            }
        });

        mocha.suite.afterEach(async function () {
            if (this.currentTest && this.currentTest.state !== 'passed') {
                try {
                    await browser.takeScreenshot(this.currentTest.fullTitle());
                } catch (err) {
                    console.log('Screenshot capture failed');
                }
            }
        });

        mocha.suite.beforeAll(async function () {
            this.timeout(15000);
            await browser.start(self.chromeBin);
            await browser.waitForWorkbench();
            await new Promise((res) => { setTimeout(res, 2000); });
        });

        mocha.suite.afterAll(async function() {
            this.timeout(15000);
            await browser.quit();
        });

        return new Promise((resolve) => {
            mocha.run((failures) => {
                resolve(failures);
            });
        })
    }
}