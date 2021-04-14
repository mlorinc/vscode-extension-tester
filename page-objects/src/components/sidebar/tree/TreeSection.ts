import { ViewSection } from "../ViewSection";
import { ITreeItem, ITreeSection, TreeItemNotFound } from "extension-tester-page-objects";

/**
 * Abstract representation of a view section containing a tree
 */
export abstract class TreeSection<T extends ITreeItem> extends ViewSection implements ITreeSection<T> {
    async openItem(...path: string[]): Promise<T[]> {
        const item = (await this.findItemByPath(...path));
        await item.select();
        return await item.getChildren() as T[];
    }

    async findItemByPath(...path: string[]): Promise<T> {
        return this.findItemByPathInternal(false, ...path);
    }

    protected async findItemByPathInternal(strict: boolean, ...path: string[]): Promise<T> {
        let items: T[] = [];

        for (let i = 0; i < path.length; i++) {
            const item = await this.findItem(path[i], i + 1);
            if (await item?.hasChildren() && !await item?.isExpanded()) {
                await item?.click();
            }
        }

        let currentItem = await this.findItem(path[0], 1);
        let i = 0;
        for (; i < path.length; i++) {
            if (!currentItem) {
                throw new TreeItemNotFound(path, `Item ${path[i]} not found`);
            }
            items = await currentItem.getChildren() as T[];
            if (items.length < 1) {
                return currentItem;
            }
            if (i + 1 < path.length) {
                currentItem = undefined;
                for (const item of items) {
                    if (await item.getLabel() === path[i + 1]) {
                        currentItem = item;
                        break;
                    }
                }
            }
        }

        if (!currentItem) {
            throw new TreeItemNotFound(path);
        }

        if (strict && i !== path.length) {
            throw new TreeItemNotFound(path, 'Strict search was used.');
        }

        return currentItem;
    }

    abstract findItem(label: string, maxLevel?: number): Promise<T | undefined>
    abstract getVisibleItems(): Promise<T[]>
}
