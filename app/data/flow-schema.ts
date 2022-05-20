import * as yup from "yup";

const flowSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    showProgress: yup.boolean().required(),
});

const screenSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    locale: yup.string().required(),
    forward: yup.string().required(),
    skip: yup.string().nullable(),
    guideTitle: yup.string().nullable(),
    guideUrl: yup.string().url().nullable(),
    header: yup
        .object({
            title: yup.string().required(),
            subtitle: yup.string().nullable(),
        })
        .nullable(),
    simple: yup.array().of(
        yup.object({
            body: yup.string().required(),
            images: yup.array().of(
                yup.object({
                    url: yup.string().required(),
                })
            ),
            logo: yup
                .object({
                    url: yup.string().required(),
                })
                .nullable(),
        })
    ),
});

const schema = yup.object().shape({
    data: yup.object().shape({
        flows: yup.array(flowSchema).default(() => {
            return [];
        }),
        screens: yup.array(screenSchema).default(() => {
            return [];
        }),
    }),
});

export default schema;
