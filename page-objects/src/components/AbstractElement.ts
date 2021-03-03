import { AbstractElement } from 'extension-tester-page-objects';
import { WebDriver } from 'selenium-webdriver';
import { Locators } from '../locators/locators';

export class VSCodeAbstractElement extends AbstractElement {
    protected static get locators(): Locators {
        return AbstractElement.locators as Locators;
    }

    protected static get driver(): WebDriver {
        return AbstractElement.driver;
    }

    protected static get versionInfo() {
        return AbstractElement.versionInfo;
    }
}

export { VSCodeAbstractElement as AbstractElement };
