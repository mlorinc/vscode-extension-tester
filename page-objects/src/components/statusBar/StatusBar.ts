import { getTimeout, INotificationsCenter, repeat } from "extension-tester-page-objects";
import { By, Locator, until } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { NotificationsCenter } from "../workbench/NotificationsCenter";

/**
 * Page object for the status bar at the bottom
 */
export class StatusBar extends AbstractElement {
    constructor() {
        super(StatusBar.locators.StatusBar.constructor, StatusBar.locators.Workbench.constructor);
    }

    /**
     * Open the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    async openNotificationsCenter(): Promise<INotificationsCenter> {
        await this.toggleNotificationsCentre(true);
        return new NotificationsCenter();
    }

    /**
     * Close the notifications center
     * @returns Promise resolving when the notifications center is closed
     */
    async closeNotificationsCenter(): Promise<void> {
        await this.toggleNotificationsCentre(false);
    }

    /**
     * Open the language selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the language selection is opened
     */
    async openLanguageSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.language).click();
    }

    /**
     * Get the current language label text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current language
     */
    async getCurrentLanguage(): Promise<string> {
        return this.getPartText(StatusBar.locators.StatusBar.language);
    }

    /**
     * Open the quick pick for line endings selection
     * Only works with an open editor
     * @returns Promise resolving when the line ending selection is opened
     */
    async openLineEndingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.lines).click();
    }

    /**
     * Get the currently selected line ending as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current line ending
     */
    async getCurrentLineEnding(): Promise<string> {
        return this.getPartText(StatusBar.locators.StatusBar.lines);
    }

    /**
     * Open the encoding selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the encoding selection is opened
     */
    async openEncodingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.encoding).click();
    }

    /**
     * Get the name of the current encoding as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current encoding
     */
    async getCurrentEncoding(): Promise<string> {
        return this.getPartText(StatusBar.locators.StatusBar.encoding);
    }

    /**
     * Open the indentation selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the indentation selection is opened
     */
    async openIndentationSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.indent).click();
    }

    /**
     * Get the current indentation option label as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current indentation
     */
    async getCurrentIndentation(): Promise<string> {
        return this.getPartText(StatusBar.locators.StatusBar.indent);
    }

    /**
     * Open the line selection input box
     * Only works with an open editor
     * @returns Promise resolving when the line selection is opened
     */
    async openLineSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.selection).click();
    }

    /**
     * Get the current editor coordinates as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current position in the editor
     */
    async getCurrentPosition(): Promise<string> {
        return this.getPartText(StatusBar.locators.StatusBar.selection);
    }

    /**
     * Open/Close notification centre
     * @param open true to open, false to close
     */
    private async toggleNotificationsCentre(open: boolean): Promise<void> {
        if (await NotificationsCenter.isOpen() === open) {
            return;
        }

        const bell = await this.findElement(StatusBar.locators.StatusBar.bell);
        await bell.getDriver().wait(until.elementIsEnabled(bell), getTimeout());
        await bell.click();

        await repeat(async () => await NotificationsCenter.isOpen() === open,
            {
                timeout: getTimeout(),
                threshold: 400,
                message: `Waiting for notification center to be ${open ? 'open' : 'closed'}.`
            });
    }

    private async getPartText(locator: Locator): Promise<string> {
        return this.findElement(locator).findElement(By.css('a')).getAttribute('innerHTML');
    }
}
