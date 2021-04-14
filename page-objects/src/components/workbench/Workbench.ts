import * as path from 'path';
import {
    AbstractElement,
    ActivityBar,
    BottomBarPanel,
    EditorView,
    InputBox,
    NotificationsCenter,
    parseTitleBar,
    QuickOpenBox,
    SettingsEditor,
    SideBarView,
    StatusBar,
    TitleBar
} from '../..';
import { DialogHandler } from 'vscode-extension-tester-native';
import { Key, until, WebElement } from 'selenium-webdriver';
import { Notification, StandaloneNotification } from './Notification';
import {
    IOpenDialog,
    PathUtils,
    SeleniumBrowser,
} from 'extension-tester-page-objects';

/**
 * Handler for general workbench related actions
 */
export class Workbench extends AbstractElement {
    constructor() {
        super(Workbench.locators.Workbench.constructor);
    }

    /**
     * Get path of open folder/workspace
     */
    async getOpenFolderPath(): Promise<string> {
        const { folder } = await parseTitleBar();
        if (folder) {
            return folder;
        }
        else {
            throw new Error('There are not open folders in VS Code. Use Workbench.openFolder function first or try passing absolute path.');
        }
    }

    /**
     * Get name of open folder/workspace
     */
    async getOpenFolderName(): Promise<string> {
        return path.basename(await this.getOpenFolderPath());
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
     * @returns promise which is resolved when workbench is ready
     */
    async openFolder(folderPath: string): Promise<void> {
        await new TitleBar().select('File', 'Open Folder...');

        const dialog = await this.getOpenDialog();
        folderPath = PathUtils.normalizePath(folderPath);

        if (!path.isAbsolute(folderPath)) {
            folderPath = path.join(await this.getOpenFolderPath(), folderPath);
        }

        await dialog.selectPath(folderPath);
        await dialog.confirm();
        await this.openFolderWaitCondition(folderPath, 40000);
    }

    /**
     * Close open folder.
     * @returns promise which is resolved when folder is closed
     */
    async closeFolder(): Promise<void> {
        if (process.env.OPEN_FOLDER && PathUtils.normalizePath(process.env.OPEN_FOLDER) === await this.getOpenFolderPath()) {
            return;
        }

        await new TitleBar().select('File', 'Close Folder');
        await this.getDriver().wait(async () => {
            try {
                const title = new TitleBar().getTitle();
                return await title === 'Welcome - Visual Studio Code';
            }
            catch {
                return undefined;
            }
        }, 40000, `Could not find "Welcome - Visual Studio Code" in window title. (closeFolder)`);

        // open default workspace
        if (process.env.OPEN_FOLDER) {
            await this.openFolder(process.env.OPEN_FOLDER);
        }
    }

    /**
    * Return existing open dialog object.
    */
    getOpenDialog(): Promise<IOpenDialog> {
        return DialogHandler.getOpenDialog();
    }

    private async openFolderWaitCondition(folderPath: string, timeout: number = 40000): Promise<void> {
        await SeleniumBrowser.instance.driver.wait(async () => {
            try {
                return await this.getOpenFolderPath() === folderPath;
            }
            catch (e) {
                return false;
            }
        }, timeout, `Could not find open folder with path "${folderPath}".`);
    }
}
