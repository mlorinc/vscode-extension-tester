import { WebElement } from "selenium-webdriver";
import { IViewSection } from "extension-tester-page-objects";
import { AbstractElement, CustomTreeSection, DefaultTreeSection, ExtensionsViewSection, SideBarView } from "../..";

/**
 * Page object representing the view container of a side bar view
 */
export class ViewContent extends AbstractElement {
    constructor(view: SideBarView = new SideBarView()) {
        super(ViewContent.locators.ViewContent.constructor, view);
    }

    /**
     * Finds whether a progress bar is active at the top of the view
     * @returns Promise resolving to true/false
     */
    async hasProgress(): Promise<boolean> {
        const progress = await this.findElement(ViewContent.locators.ViewContent.progress);
        const hidden = await progress.getAttribute('aria-hidden');
        if (hidden === 'true') {
            return false;
        }
        return true;
    }

    /**
     * Retrieves a collapsible view content section by its title
     * @param title Title of the section
     * @returns Promise resolving to ViewSection object
     */
    async getSection(title: string): Promise<IViewSection> {
        const elements = await this.findElements(ViewContent.locators.ViewContent.section);
        let panel!: WebElement;

        for (const element of elements) {
            const currentTitle = await element.findElement(ViewContent.locators.ViewContent.sectionTitle);
            if (await currentTitle.getAttribute(ViewContent.locators.ViewContent.sectionText) === title) {
                panel = element;
                break;
            }
        }
        if (!panel) {
            throw new Error(`No section with title '${title}' found`);
        }
        return await this.createSection(panel);
    }

    /**
     * Retrieves all the collapsible view content sections
     * @returns Promise resolving to array of ViewSection objects
     */
    async getSections(): Promise<IViewSection[]> {
        const sections: IViewSection[] = [];
        const elements = await this.findElements(ViewContent.locators.ViewContent.section);
        for (const element of elements) {
            let section = await this.createSection(element);
            sections.push(await section.wait());
        }
        return sections;
    }

    private async createSection(panel: WebElement): Promise<IViewSection> {
        let section: IViewSection = new DefaultTreeSection(panel, this);
        try {
            await section.findElement(ViewContent.locators.ViewContent.defaultView);
        } catch (err) {
            try {
                await section.findElement(ViewContent.locators.ViewContent.extensionsView);
                section = new ExtensionsViewSection(panel, this);
            } catch (err) {
                section = new CustomTreeSection(panel, this);
            }
        }
        return section;
    }
}
