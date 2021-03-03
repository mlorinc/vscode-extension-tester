import { LocatorLoader as ILocatorLoader } from "extension-tester-page-objects";
import { Locators } from "./locators";

export class LocatorLoader extends ILocatorLoader<Locators> {
    protected parseVersion(version: string): string {
        return version;
    }
    constructor(version: string, baseVersion: string, baseFolder: string) {
        super(version, baseVersion, baseFolder);
    }
}
