import { __decorate, __metadata } from "tslib";
import { PrimaryGeneratedColumn } from 'typeorm';
import { VersionedBaseEntity } from 'typeorm-versions';
export class DBBaseEntityUnid extends VersionedBaseEntity {
    unid;
}
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], DBBaseEntityUnid.prototype, "unid", void 0);
//# sourceMappingURL=DBBaseEntityUnid.js.map