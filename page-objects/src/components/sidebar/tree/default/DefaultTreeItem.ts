import { TreeItem } from "../../ViewItem";
import { WebElement } from "selenium-webdriver";
import { IDefaultTreeItem, ITreeItem } from "extension-tester-page-objects";
import { DefaultTreeSection } from "../../../..";

/**
 * Default tree item base on the items in explorer view
 */
export class DefaultTreeItem extends TreeItem implements IDefaultTreeItem {
    constructor(element: WebElement, viewPart: DefaultTreeSection) {
        super(element, viewPart);
    }

    async isFile(): Promise<boolean> {
        return await this.isExpandable() === false;
    }
    
    async isFolder(): Promise<boolean> {
        return await this.isExpandable() === true;
    }

    async getLabel(): Promise<string> {
        return this.getAttribute(DefaultTreeItem.locators.DefaultTreeSection.itemLabel);
    }

    async getTooltip(): Promise<string> {
        const tooltip = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.tooltip);
        return tooltip.getAttribute('title');
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    async getChildren(): Promise<ITreeItem[]> {
        const rows = await this.getChildItems(DefaultTreeItem.locators.DefaultTreeSection.itemRow);
        const items = await Promise.all(rows.map(async row => new DefaultTreeItem(row, this.enclosingItem as DefaultTreeSection).wait()));
        return items;
    }

    async isExpandable(): Promise<boolean> {
        const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }
}
