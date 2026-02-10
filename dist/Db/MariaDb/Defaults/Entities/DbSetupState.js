import { __decorate, __metadata } from "tslib";
import { Column, Entity } from 'typeorm';
import { DBBaseEntityUnid } from '../../DBBaseEntityUnid.js';
let DbSetupState = class DbSetupState extends DBBaseEntityUnid {
    appliedAt;
};
__decorate([
    Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], DbSetupState.prototype, "appliedAt", void 0);
DbSetupState = __decorate([
    Entity({ name: 'db_setup_state' })
], DbSetupState);
export { DbSetupState };
//# sourceMappingURL=DbSetupState.js.map