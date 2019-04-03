import { AbstractElement } from "../AbstractElement";
import { ViewTitlePart, By, ViewContent } from "../../../extester";

/**
 * Page object for the side bar view
 */
export class SideBarView extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.sidebar'), By.id('workbench.main.container'));
    }

    /**
     * Get the top part of the open view (contains title and possibly some buttons)
     * @returns ViewTitlePart object
     */
    getTitlePart(): ViewTitlePart {
        return new ViewTitlePart(this);
    }

    /**
     * Get the content part of the open view
     * @returns ViewContent object
     */
    getContent(): ViewContent {
        return new ViewContent(this);
    }
}