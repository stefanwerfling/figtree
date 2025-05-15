import { __decorate, __metadata } from "tslib";
import { PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
export class DBBaseEntityUnid extends BaseEntity {
    unid;
}
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], DBBaseEntityUnid.prototype, "unid", void 0);
//# sourceMappingURL=DBBaseEntityUnid.js.map