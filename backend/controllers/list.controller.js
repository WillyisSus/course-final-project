import models from "../utils/db.js";
import * as z from "zod";
import {validate} from "../utils/validator.js";
/*
title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'instructors',
        key: 'instructor_id'
      }
    },
    level_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'levels',
        key: 'level_id'
      }
    },
    rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    total_hours: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    total_lectures: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    current_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    original_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    is_bestseller: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
*/ 
const courseSchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1),
    image_url: z.string().max(1000).optional(), 
    instructor_id: z.int().min(1).optional(),   
    level_id: z.int().min(1).optional(),
    rating: z.coerce.number().optional(),
    total_reviews: z.int().min(0).optional().default(0),
    total_hours: z.coerce.number(),
    total_lectures: z.int().min(1),
    current_price: z.coerce.number(),
    original_price: z.coerce.number(),
    is_bestseller: z.boolean().default(false),
})
    
const listController = {
    getAll: async (req, res) => {
        try {
            // Insert new code here
            const {page} = req.query
            const limit = 7;
            var list = []
            const totalCount = await models.courses.count();
            console.log("Total courses count:", totalCount);    
            console.log(page);

            if (page){
                if (page <= 0)  return res.status(400).json({ message: "Page number must be greater than 0" });
                const offset =  (page - 1) *limit;
                list = await models.courses.findAll(
                    {include: [
                        {
                            model: models.levels,
                            as: 'level',
                            left: true
                        }, {
                            model: models.instructors,
                            as: 'instructor',
                            left:true           
                            }]
                    }, 
                    {limit: limit, offset: offset},
                    
                    
                );
            
            }else{
                  list = await models.courses.findAll(
                    {include: [
                        {
                            model: models.levels,
                            as: 'level',
                            left: true,
                        }, {
                            model: models.instructors,
                            as: 'instructor' ,
                            left: true,          
                            }]
                    }, 
                );
            }
            
            if (list.length === 0) {
                return res.status(404).json({ message: "No lists found" });
            };
            res.json({list: list, totalCount: totalCount, hasNextPage: (totalCount - (page * limit)) > 0});
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Get template with id ${req.params.id}` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    postOne: async (req, res) => {
        try {
            console.log("Received data for new template:", req.body);
            // Insert new code here

            const result = courseSchema.safeParse(req.body);
            if (!result.success) {
                console.log("Validation errors:", result);
                return res.status(400).json({ errors: result.error.errors });
            }
            const courseData = req.body;
            console.log("Course data to be saved:", courseData);
            const newCourse = models.courses.build(courseData);
            await newCourse.save();
            console.log("New course created:", newCourse);
            res.status(201).json({ message: "New template created", value: newCourse});
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    putOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Template with id ${req.params.id} updated` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    deleteOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Template with id ${req.params.id} deleted` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

}

export default listController;