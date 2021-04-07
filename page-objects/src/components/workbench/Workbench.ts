import { AbstractElement } from "../AbstractElement";
import { WebElement, Key, until, By } from "selenium-webdriver";
import { TitleBar } from "../menu/TitleBar";
import { SideBarView } from "../sidebar/SideBarView";
import { ActivityBar } from "../activityBar/ActivityBar";
import { StatusBar } from "../statusBar/StatusBar";
import { EditorView } from "../editor/EditorView";
import { BottomBarPanel } from "../bottomBar/BottomBarPanel";
import { Notification, StandaloneNotification } from "./Notification";
import { NotificationsCenter } from "./NotificationsCenter";
import { QuickOpenBox } from "./input/QuickOpenBox";
import { SettingsEditor } from "../editor/SettingsEditor";
import { InputBox } from "./input/InputBox";
import { DialogHandler } from "vscode-extension-tester-native";
import * as path from 'path';
import { SeleniumBrowser } from "extension-tester-page-objects";
import { Editor } from "../editor/Editor";
import { TextEditor } from "../editor/TextEditor";

/**
 * Handler for general workbench related actions
 */
export class Workbench extends AbstractElement {
    protected static currentPath: string = process.cwd();

    constructor() {
        super(Workbench.locators.Workbench.constructor);
    }

    /**
     * Get a title bar handle
     */
    getTitleBar(): TitleBar {
        return new TitleBar();
    }

    /**
     * Get a side bar handle
     */
    getSideBar(): SideBarView {
        return new SideBarView();
    }

    /**
     * Get an activity bar handle
     */
    getActivityBar(): ActivityBar {
        return new ActivityBar();
    }

    /**
     * Get a status bar handle
     */
    getStatusBar(): StatusBar {
        return new StatusBar();
    }

    /**
     * Get a bottom bar handle
     */
    getBottomBar(): BottomBarPanel {
        return new BottomBarPanel();
    }

    /**
     * Get a handle for the editor view
     */
    getEditorView(): EditorView {
        return new EditorView();
    }

    /**
     * Get all standalone notifications (notifications outside the notifications center)
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(): Promise<Notification[]> {
        const notifications: Notification[] = [];
        let container: WebElement;
        try {
            container = await this.findElement(Workbench.locators.Workbench.notificationContainer);
        } catch (err) {
            return [];
        }
        const elements = await container.findElements(Workbench.locators.Workbench.notificationItem);
        
        for (const element of elements) {
            notifications.push(await new StandaloneNotification(element).wait());
        }
        return notifications;
    }

    /**
     * Opens the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    openNotificationsCenter(): Promise<NotificationsCenter> {
        return new StatusBar().openNotificationsCenter();
    }
    
    /**
     * Opens the settings editor
     *
     * @returns promise that resolves to a SettingsEditor instance
     */
    async openSettings(): Promise<SettingsEditor> {
        await this.executeCommand('open user settings');
        await Workbench.driver.wait(until.elementLocated(Workbench.locators.Editor.constructor));
        await new Promise((res) => setTimeout(res, 500));
        return new SettingsEditor();
    }

    /**
     * Open the VS Code command line prompt
     * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
     */
    async openCommandPrompt(): Promise<QuickOpenBox | InputBox> {
        await this.getDriver().actions().sendKeys(Key.F1).perform();
        if (Workbench.versionInfo.browser.toLowerCase() === 'vscode' && Workbench.versionInfo.version >= '1.44.0') {
            return InputBox.create();
        }
        return QuickOpenBox.create();
     }

    /**
     * Open the command prompt, type in a command and execute
     * @param command text of the command to be executed
     * @returns Promise resolving when the command prompt is confirmed
     */
    async executeCommand(command: string): Promise<void> {
        const prompt = await this.openCommandPrompt();
        await prompt.setText(`>${command}`);
        await prompt.confirm();
    }

    /**
     * Open folder. Relative paths are resolved to absolute paths based on current open folder.
     * @param folderPath path to folder
     * @param handleOnly if handleOnly is set to true, library is responsible for entire open procedure  
     * @returns promise which is resolved when workbench is ready
     */
    async openFolder(folderPath: string, handleOnly: boolean = false): Promise<void> {
        if (!handleOnly) {
            await new TitleBar().select('File', 'Open Folder...');
        }

        const dialog = await DialogHandler.getOpenDialog();
        
        if (!path.isAbsolute(folderPath)) {
            folderPath = path.join(Workbench.currentPath, folderPath);
        }

        await dialog.selectPath(folderPath);
        await dialog.confirm();
        await openFolderWaitCondition(path.basename(folderPath), 40000);
        Workbench.currentPath = folderPath;
    }

    /**
     * Open file and return its editor. Relative paths are resolved to absolute paths based on current open folder.
     * @param path path to file.
     * @param handleOnly if handleOnly is set to true, library is responsible for entire open procedure 
     * @returns editor instance with open file
     */
    async openFile(filePath: string, handleOnly: boolean = false): Promise<Editor> {
        if (!handleOnly) {
            await new TitleBar().select('File', 'Open File...');
        }

        const dialog = await DialogHandler.getOpenDialog();
        
        if (!path.isAbsolute(filePath)) {
            filePath = path.join(Workbench.currentPath, filePath);
        }

        await dialog.selectPath(filePath);
        await dialog.confirm();

        return await this.getDriver().wait(async () => {
            const editorTab = await new EditorView().getActiveTab();

            if (editorTab === undefined) {
                return undefined;
            }

            if (filePath.includes(await editorTab.getTitle())) {
                const editor = new TextEditor();
                const tab = await editor.getTab();
                if (await tab.getId() === await editorTab.getId()) {
                    return editor;
                }
            }

            return undefined;
        }, 40000, `Could not find open editor for "${filePath}".`) as Editor;
    }

    /**
     * Close open folder.
     * @param handleOnly if handleOnly is set to true, library is responsible for entire close procedure  
     * @returns promise which is resolved when folder is closed
     */
    async closeFolder(handleOnly?: boolean): Promise<void> {
        if (!handleOnly) {
            await new TitleBar().select('File', 'Close Folder');
        }

        await this.getDriver().wait(async () => {
            const editorTab = await new EditorView().getActiveTab();

            if (editorTab === undefined) {
                return undefined;
            }

            if (await editorTab.getTitle() === 'Welcome') {
                return true;
            }

            return undefined;
        }, 40000, `Could not find Welcome tab. (closeFolder)`);
     }
}

async function openFolderWaitCondition(folderName: string, timeout?: number): Promise<void> {
	await SeleniumBrowser.instance.driver.wait(async () => {
		try {
			const section = await new SideBarView().getContent().getSection(folderName);
			const html = await section.getDriver().wait(until.elementLocated(By.css("html")), 150);
			return await section.isDisplayed() && await section.isEnabled() && html;
		}
		catch {
			return false;
		}
	}, timeout, `Timed out: openFolderWaitCondition('${folderName}', ${timeout})`);
}
