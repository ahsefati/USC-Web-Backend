import mongoose from "mongoose";

const costSchema = mongoose.Schema({
    free_degree:{
        humanities:{
            bachelor: Number,
            masters: Number,
            phd: Number
        },
        art:{
            bachelor: Number,
            masters: Number,
            phd: Number 
        },
        engineering:{
            bachelor: Number,
            masters: Number,
            phd: Number
        },
        oloom_paye:{
            bachelor: Number,
            masters: Number,
            phd: Number
        },
        pezeshki_pirapezeshki:{
            bachelor: Number,
            masters: Number,
            dental: Number,
            pharmacy: Number
        }
    },

    english_exam:{
        toefl:{
            mock:Number,
            official: Number,
            mailing_grades:Number
        },
        ielts:{
            mock:Number,
            official: Number,
            mailing_grades:Number
        }
    },
    
    unknown_destination:{
        ticket: Number,
        visa: Number,
        rent: Number,
        deposit: Number,
        grocery: Number,
        appFee: Number,
        tuition: Number
    },
    
    visa:{
        usa:{
            appointment:Number,
            pickup:Number
        },
        canada:{
            appointment:Number,
            pickup:Number
        }
    },

    military: Number

})


const Costs = mongoose.model('Costs', costSchema)

export default Costs