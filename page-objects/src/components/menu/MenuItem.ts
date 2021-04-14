import { IMenuItem } from "extension-tester-page-objects";
import { AbstractElement, Menu } from "../..";

/**
 * Abstract element representing a menu item
 */
export abstract class MenuItem extends AbstractElement implements IMenuItem {
    protected parent!: Menu;
    protected label!: string;

    /**
     * Use the given menu item: Opens the submenu if the item has children,
     * otherwise simply click the item.
     * 
     * @returns Menu object representing the submenu if the item has children, void otherwise.
     */
    async select(): Promise<Menu | undefined> {
        await this.click();
        return undefined;
    }

    /**
     * Return the Menu object representing the menu this item belongs to
     */
    getParent(): Menu {
        return this.parent;
    }

    /**
     * Returns the label of the menu item
     */
    async getLabel(): Promise<string> {
        return this.label;
    }

    async isNesting(): Promise<boolean> {
        return false;
    }
}
