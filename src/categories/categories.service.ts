// Service layer for the categories resource.
// Categories are public to read but admin-only to create/update/delete.

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // Returns all categories sorted alphabetically — used by frontend dropdowns and lists
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ name: 1 });
  }

  async findById(id: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException('Category not found.');
    return cat;
  }

  // Checks for duplicate name before creating to give a cleaner error than the DB unique index
  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const existing = await this.categoryModel.findOne({ name: dto.name });
    if (existing) throw new ConflictException('Category name already exists.');
    return new this.categoryModel(dto).save();
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true, // return the updated document instead of the original
    });
    if (!cat) throw new NotFoundException('Category not found.');
    return cat;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Category not found.');
  }
}
