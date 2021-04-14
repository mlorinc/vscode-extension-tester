import { IOpenDialog } from "extension-tester-page-objects";
import { LinuxOpenDialog, WindowsOpenDialog, MacOpenDialog } from "./openDialog";

/**
 * Handles native dialogs for different platforms
 */
export class DialogHandler {

    /**
     * Get the appropriate native dialog for opening folders.
     * Returns platform specific dialog object.
     * 
     * @param delay time to wait for the dialog to open in milliseconds
     */
    static async getOpenDialog(delay: number = 4000): Promise<IOpenDialog> {
        await new Promise((res) => { setTimeout(res, delay); });
        switch (process.platform) {
            case 'win32': {
                return new WindowsOpenDialog();
            }
            case 'darwin': {
                return new MacOpenDialog();
            }
            case 'linux': {
                return new LinuxOpenDialog();
            }
        }
        return new LinuxOpenDialog();
    }
}
