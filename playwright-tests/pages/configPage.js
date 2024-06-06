import { blocks } from "../data/actionBlock";

export class ConfigPage {
  constructor(page) {
    this.page = page;
    this.addActionBlockButton = page.getByText("Add action block...");
    this.selectAllCheckbox = page.locator(".w-fit > .border-white");
    this.removeButton = page.locator(
      "div:nth-child(2) > div:nth-child(2) > button:nth-child(5)"
    );
    this.blocks = blocks(page);
  }

  async addActionBlock(category, blockName) {
    await this.addActionBlockButton.click();
    await this.blocks[category][blockName]["block"].click();
  }
  async openAddActionBlock() {
    await this.addActionBlockButton.click();
  }

  async removeAllActions() {
    await this.selectAllCheckbox.click();
    await this.removeButton.click();
  }
}
