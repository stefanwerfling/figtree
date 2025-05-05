import { __decorate, __metadata } from "tslib";
import { PrimaryGeneratedColumn } from 'typeorm';
import { VersionedBaseEntity } from 'typeorm-versions';
export class DBBaseEntityId extends VersionedBaseEntity {
    id;
}
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], DBBaseEntityId.prototype, "id", void 0);
//# sourceMappingURL=DBBaseEntityId.js.map