import { IMenuItem, ITitleBar, PathUtils } from "extension-tester-page-objects";
import { Key } from "selenium-webdriver";
import { WindowControls, ContextMenu, Menu, MenuItem } from "../..";
import * as fs from "fs";
/**
 * Page object representing the custom VSCode title bar
 */
export class TitleBar extends Menu implements ITitleBar {
    constructor() {
        super(TitleBar.locators.TitleBar.constructor, TitleBar.locators.Workbench.constructor);
    }

    /**
     * Get title bar item by name
     * @param name name of the item to search by
     * @returns Promise resolving to TitleBarItem object
     */
    async getItem(name: string): Promise<IMenuItem | undefined> {
        try {
            await this.findElement(TitleBar.locators.TitleBar.itemConstructor(name));
            return await new TitleBarItem(name, this).wait();
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get all title bar items
     * @returns Promise resolving to array of TitleBarItem objects
     */
    async getItems(): Promise<IMenuItem[]> {
        const items: IMenuItem[] = [];
        const elements = await this.findElements(TitleBar.locators.TitleBar.itemElement);

        for (const element of elements) {
            if (await element.isDisplayed()) {
                items.push(await new TitleBarItem(await element.getAttribute(TitleBar.locators.TitleBar.itemLabel), this).wait());
            }
        }
        return items;
    }

    /**
     * Get the window title
     * @returns Promise resolving to the window title
     */
    async getTitle(): Promise<string> {
        return this.findElement(TitleBar.locators.TitleBar.title).getText();
    }

    /**
     * Get a reference to the WindowControls
     */
    getWindowControls(): WindowControls {
        return new WindowControls(this);
    }
}

/**
 * Page object representing an item of the custom VSCode title bar
 */
export class TitleBarItem extends MenuItem {
    constructor(label: string, parent: TitleBar) {
        super(TitleBar.locators.TitleBar.itemConstructor(label), parent);
        this.parent = parent;
        this.label = label;
    }

    async select(): Promise<ContextMenu> {
        const openMenus = await this.getDriver().findElements(TitleBar.locators.ContextMenu.constructor);
        if (openMenus.length > 0 && openMenus[0].isDisplayed()) {
            await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
        }
        await this.click();
        return new ContextMenu(this).wait();
    }
}

export async function parseTitleBar(): Promise<{ file: string | undefined, folder: string | undefined }> {
    const title = await new TitleBar().getTitle();

    const segments = title.split(' - ');
    let file: string | undefined = undefined;
    let folder: string | undefined = undefined;

    for (const segment of segments) {
        try {
            const segmentValue = PathUtils.normalizePath(segment);
            const stat = fs.statSync(segmentValue);
            if (stat.isDirectory()) {
                folder = segmentValue;
            }
            else if (stat.isFile()) {
                file = segmentValue;
            }

            if (file && folder) {
                break;
            }
        }
        catch (e) {
            if (!e.message.includes('no such file or directory')) {
                throw e;
            }
            continue;
        }
    }

    return { file, folder }
}
