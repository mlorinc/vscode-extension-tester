import { TreeSection } from "../TreeSection";
import { CustomTreeItem } from "./CustomTreeItem";
import { Key } from "selenium-webdriver";

/**
 * Custom tree view, e.g. contributed by an extension
 */
export class CustomTreeSection extends TreeSection<CustomTreeItem> {

    async getVisibleItems(): Promise<CustomTreeItem[]> {
        const items: CustomTreeItem[] = [];
        const elements = await this.findElements(CustomTreeSection.locators.CustomTreeSection.itemRow);
        for (const element of elements) {
            items.push(await new CustomTreeItem(element, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<CustomTreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(CustomTreeSection.locators.CustomTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: CustomTreeItem | undefined = undefined;
        
        const elements = await container.findElements(CustomTreeSection.locators.CustomTreeSection.itemRow);
        for (const element of elements) {
            const temp = await element.findElements(CustomTreeSection.locators.CustomTreeSection.rowWithLabel(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(CustomTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new CustomTreeItem(element, this).wait();
                } 
            }
        }            
        return item;
    }
}
