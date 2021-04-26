import { getTimeout, INotification, INotificationsCenter, NotificationType, repeat } from "extension-tester-page-objects";
import { AbstractElement } from "../AbstractElement";
import { CenterNotification } from "./Notification";

/**
 * Notifications center page object
 */
export class NotificationsCenter extends AbstractElement implements INotificationsCenter {
    constructor() {
        super(NotificationsCenter.locators.NotificationsCenter.constructor, NotificationsCenter.locators.Workbench.constructor);
    }

    /**
     * Close the notifications center
     * @returns Promise resolving when the center is closed
     */
    async close(): Promise<void> {
        await repeat(async () => {
            if (await NotificationsCenter.isOpen() === false) {
                return true;
            }

            try {
                // safe click does not work well in this scenario
                const close = await this.findElement(NotificationsCenter.locators.NotificationsCenter.close);
                await close.click();
            }
            catch (e) {
                if (e.message.includes('element not interactable') || e.message.includes('element click intercepted')) {
                    return false;
                }
                throw e;
            }

            return false;
        }, {
            timeout: getTimeout(),
            threshold: 400,
            message: 'Could not close notification center.'
        });
    }

    /**
     * Clear all notifications in the notifications center
     * Note that this will also hide the notifications center
     * @returns Promise resolving when the clear all button is pressed
     */
    async clearAllNotifications(): Promise<void> {
        if (await NotificationsCenter.isOpen() === false) {
            throw new Error('Cannot clear notifications. Notification center is closed.');
        }

        const clearAll = await this.findElement(NotificationsCenter.locators.NotificationsCenter.clear);
        
        await repeat(async () => {
            if (await NotificationsCenter.isOpen() === false) {
                return true;
            }

            if (await clearAll.isEnabled() === false) {
                return true;
            }

            try {
                await clearAll.click();
            }
            catch (e) {
                if (e.message.includes('element not interactable') || e.message.includes('element click intercepted')) {
                    return false;
                }
                throw e;
            }

            return false;
        }, {
            timeout: getTimeout(),
            threshold: 400,
            message: 'Could not clear notification center'
        });
    }

    /**
     * Get all notifications of a given type
     * @param type type of the notifications to look for,
     * NotificationType.Any will retrieve all notifications
     * 
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(type: NotificationType): Promise<INotification[]> {
        const notifications: INotification[] = [];
        const elements = await this.findElements(NotificationsCenter.locators.NotificationsCenter.row);

        for (const element of elements) {
            const not = new CenterNotification(element);
            if (type === NotificationType.Any || await not.getType() === type) {
                notifications.push(await not.wait());
            }
        }
        return notifications;
    }

    static async isOpen(): Promise<boolean> {
        const centers = await NotificationsCenter.driver.findElements(NotificationsCenter.locators.NotificationsCenter.constructor);
        return centers.length > 0 && await centers[0].isDisplayed();
    }
}
