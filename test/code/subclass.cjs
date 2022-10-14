const { Proskomma } = require("../../dist");
const test = require('tape');

const testGroup = "Subclass test";

test(
    `Creating a subclass from lib (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            t.doesNotThrow(() => {
                class SubclassProskomma extends Proskomma {
                    constructor() {
                        super();
                        this.test = "test";
                    }
                }
                const sbClass = new SubclassProskomma();
            });
        } catch (err) {
            console.log(err)
        }
    }
);