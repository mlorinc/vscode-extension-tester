import { AbstractElement } from "./AbstractElement";
import { ContextMenu } from "..";
import { Button, until } from "selenium-webdriver";
import { IMenu } from "extension-tester-page-objects";

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContexMenu extends AbstractElement {

    /**
     * Open context menu on the element
     */
    async openContextMenu(): Promise<IMenu> {
        const workbench = await this.getDriver().findElement(ElementWithContexMenu.locators.Workbench.constructor);
        const menus = await workbench.findElements(ElementWithContexMenu.locators.ContextMenu.contextView);

        if (menus.length < 1) {
            await this.getDriver().actions().click(this, Button.RIGHT).perform();
            await this.getDriver().wait(until.elementLocated(ElementWithContexMenu.locators.ContextMenu.contextView), 2000);
            return new ContextMenu(workbench).wait();
        } else if (await menus[0].isDisplayed()) {
            await this.getDriver().actions().click(this, Button.RIGHT).perform();
            try {
                await this.getDriver().wait(until.elementIsNotVisible(this), 1000);
            } catch (err) {
                if (err.message.indexOf('stale element reference: element is not attached to the page document') < 0) {
                    throw err;
                }
            }
        }
        await this.getDriver().actions().click(this, Button.RIGHT).perform();

        return new ContextMenu(workbench).wait();
    }
}
