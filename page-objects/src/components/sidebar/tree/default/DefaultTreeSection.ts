import { TreeSection } from "../TreeSection";
import { Key, until } from 'selenium-webdriver';
import { DefaultTreeItem } from "./DefaultTreeItem";
import { FileType, IDefaultTreeItem, IDefaultTreeSection, IEditor, PathUtils, TreeItemNotFound } from "extension-tester-page-objects";
import * as path from "path";
import { ModalDialog, parseTitleBar, TextEditor, TitleBar, Workbench } from "../../../..";

/**
 * Default view section
 */
export class DefaultTreeSection extends TreeSection<IDefaultTreeItem> implements IDefaultTreeSection {
    async getVisibleItems(): Promise<IDefaultTreeItem[]> {
        const items: IDefaultTreeItem[] = [];
        const elements = await this.findElements(DefaultTreeSection.locators.DefaultTreeSection.itemRow);
        for (const element of elements) {
            items.push(await new DefaultTreeItem(element, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<IDefaultTreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(DefaultTreeSection.locators.DefaultTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: IDefaultTreeItem | undefined = undefined;
        do {
            const temp = await container.findElements(DefaultTreeSection.locators.DefaultTreeItem.ctor(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(DefaultTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new DefaultTreeItem(temp[0], this).wait();
                }
            } else {
                const lastrow = await container.findElements(DefaultTreeSection.locators.DefaultTreeSection.lastRow);
                const items = await this.getVisibleItems();
                if (lastrow.length > 0 || items.length === 0) {
                    break;
                }
                await container.sendKeys(Key.PAGE_DOWN);
            }
        } while (!item)

        return item;
    }

    async createFile(filePath: string, timeout: number = 10000): Promise<IEditor> {
        filePath = await this.createFileObject(filePath, 'file', timeout);
        return await this.openFileWaitCondition(path.join(await getOpenFolderPath(), filePath), timeout);
    }
    async createFolder(folderPath: string, timeout: number = 10000): Promise<void> {
        await this.createFileObject(folderPath, 'folder', timeout);
    }
    async deleteFile(filePath: string, timeout: number = 10000): Promise<void> {
        const workspace = await getOpenFolderPath();

        if (filePath.trim() === '') {
            throw new Error('Cannot delete empty path.');
        }

        filePath = PathUtils.getRelativePath(filePath, workspace);
        const segments = PathUtils.convertToTreePath(filePath);

        const item = await this.findItemByPathInternal(true, ...segments)

        if (item === undefined) {
            throw new Error(`Could not find file "${filePath}".`);
        }

        const menu = await item.openContextMenu();
        await menu.select('Delete');
        const dialog = new ModalDialog();

        await dialog.getDriver().wait(async () => {
            const buttons = await dialog.getButtons();
            for (const button of buttons) {
                const title = await button.getAttribute('title');

                if (title === 'Move to Trash') {
                    await button.click();
                    return true;
                }
            }
            return false;
        }, timeout, 'Could not find delete button.');
        await dialog.getDriver().wait(until.stalenessOf(dialog), timeout);
        try {
            await dialog.getDriver().wait(until.elementIsNotSelected(item), timeout);
        }
        catch {
            await dialog.getDriver().wait(until.stalenessOf(item), timeout);
        }
    }
    async deleteFolder(folderPath: string, timeout: number = 10000): Promise<void> {
        return this.deleteFile(folderPath, timeout);
    }
    async openFile(filePath: string, timeout: number = 20000): Promise<IEditor> {
        try {
            const relativePath = PathUtils.getRelativePath(filePath, await getOpenFolderPath());
            await this.openItem(...PathUtils.convertToTreePath(relativePath));
        }
        catch (e) {
            if (path.isAbsolute(filePath)) {
                await new TitleBar().select('File', 'Open File...');
                const dialog = await new Workbench().getOpenDialog(FileType.FILE);
                await dialog.selectPath(filePath);
                await dialog.confirm();
            }
            else {
                throw e;
            }
        }
            
        await this.getDriver().wait(async () => {
            try {
                const { file } = await parseTitleBar();
                const editorPath = PathUtils.normalizePath(await new TextEditor().getFilePath());
                return file === editorPath;
            }
            catch {
                return false;
            }
        }, timeout, `Could not find open editor for "${filePath}".`);
        return new TextEditor();
    }

    async existsFile(filePath: string, timeout: number = 5000): Promise<boolean> {
        return this.exists(filePath, timeout);
    }

    async existsFolder(folderPath: string, timeout: number = 5000): Promise<boolean> {
        return this.exists(folderPath, timeout);
    }

    private async openFileWaitCondition(filePath: string, timeout: number = 15000): Promise<TextEditor> {
        await this.getDriver().wait(async () => {
            try {
                const { file } = await parseTitleBar();
                const editorPath = PathUtils.normalizePath(await new TextEditor().getFilePath());
                return filePath === file && file === editorPath;
            }
            catch {
                return false;
            }
        }, timeout, `Could not find open editor for "${filePath}".`);
        return new TextEditor();
    }

    private async createFileObject(filePath: string, type: 'file' | 'folder', timeout: number = 5000) {
        filePath = PathUtils.getRelativePath(filePath, await getOpenFolderPath());
        const segments = PathUtils.convertToTreePath(filePath);
        await this.getDriver().actions().mouseMove(this).perform();

        let action: string;

        if (type === 'file') {
            action = 'New File';
        }
        else {
            action = 'New Folder';
        }

        console.log(segments.join('/'));

        if (segments.length > 1) {
            try {
                const parent = await this.findItemByPathInternal(true, ...segments.slice(0, -1));
                await parent.click();
                await parent.getDriver().wait(until.elementIsSelected(parent), timeout);
            }
            catch (e) {
                throw new Error(`Could not find parent folder "${segments.slice(0, -1).join(path.sep)}" for "${segments[segments.length - 1]}".\n${e}`);
            }
        }
        else {
            const items = await this.getVisibleItems();
            console.log(items.length);
            if (items.length > 0) {
                throw new Error(`Not supported. Cannot create another ${type}(${filePath}) with parent as root. Use your first created file/folder or delete the first file/folder.`);
            }
        }

        const newObject = await this.getAction(action);
        await newObject.getDriver().wait(until.elementIsVisible(newObject), timeout);
        await newObject.click();

        await this.getDriver().actions().sendKeys(segments[segments.length - 1], Key.ENTER).perform();
        return filePath;
    }

    private async exists(filePath: string, timeout: number = 5000): Promise<boolean> {
        try {
            filePath = PathUtils.getRelativePath(filePath, await getOpenFolderPath());
            const segments = PathUtils.convertToTreePath(filePath);

            if (timeout === 0) {       
                await this.findItemByPathInternal(true, ...segments);
                return true;
            }
            else {
                await this.getDriver().wait(async () => {
                    try {
                        await this.findItemByPathInternal(true, ...segments);
                        return true;
                    }
                    catch (e) {
                        console.log(e);
                        if (e instanceof TreeItemNotFound) {
                            return false;
                        }
                        throw e;
                    }
                }, timeout);
                return true;
            }
        }
        catch {
            return false;
        }
    }
}

function getOpenFolderPath(): Promise<string> {
    return new Workbench().getOpenFolderPath();
}
